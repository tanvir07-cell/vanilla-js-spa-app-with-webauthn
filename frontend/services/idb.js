import { loadProducts } from "../utils/loadProducts.js";
import API from "./api.js";

export async function openDB() {
  return await idb.openDB("vanilla-shop", 1, {
    async upgrade(db) {
      await db.createObjectStore("order");
    },
  });
}

export async function saveDB(userId, cart) {
  if (!userId) {
    console.error("User ID is not provided for saving the cart.");
    return;
  }

  const db = await app.openDB();

  try {
    // Save the cart to the 'order' store with the userId as the key
    await db.put("order", JSON.stringify(cart), userId);
  } catch (error) {
    console.error("Failed to save the cart to IndexedDB:", error);
  }
}

export async function loadDB(userId) {
  if (!userId) {
    console.error("User ID is not provided for loading the cart.");
    app.state.cart = []; // Initialize an empty cart if userId is missing
    return;
  }

  const db = await app.openDB();

  try {
    // Get the cart for the specific user from the 'order' store
    const cart = await db.get("order", userId);

    if (cart) {
      try {
        app.state.cart = JSON.parse(cart) || [];
      } catch (error) {
        console.error("Error parsing cart", error);
        app.state.cart = [];
      }
    } else {
      app.state.cart = []; // Initialize an empty cart if none exists
    }
  } catch (error) {
    console.error("Failed to load the cart from IndexedDB:", error);
  }
}

export async function saveProductDB() {
  return await idb.openDB("vanilla-product", 1, {
    async upgrade(db) {
      await db.createObjectStore("products", { keyPath: "title" });
    },
  });
}

export async function loadProductDB() {
  // Open the product database and image cache
  const db = await saveProductDB();
  const imageCache = await caches.open("vanilla-product-images");

  // Load from cache immediately (stale data)
  let cachedProducts = [];
  if ((await db.count("products")) > 0) {
    cachedProducts = await db.getAll("products");
    app.state.products = cachedProducts;
    console.log("Stale data from the cache");
  }

  // Revalidate with network request in the background
  try {
    const data = await API.fetchProducts();
    if (data && data.length > 0) {
      app.state.products = data;
      console.log("Data from the network");

      // Update the cached data
      await db.clear("products");
      app.state.products.forEach((product) => db.add("products", product));

      // Update image cache
      app.state.products.forEach((product) =>
        imageCache.add(new Request(product.thumbnail))
      );
    }
  } catch (e) {
    // Handle network error, no action needed since cache was already served
    console.log("Network error, stale data shown");
  }
}
