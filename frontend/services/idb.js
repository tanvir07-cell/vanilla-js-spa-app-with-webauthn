import { loadProducts } from "../utils/loadProducts.js";
import API from "./api.js";

export async function openDB() {
  return await idb.openDB("vanilla-shop", 1, {
    async upgrade(db) {
      await db.createObjectStore("order");
    },
  });
}

export async function saveDB() {
  const db = await app.openDB();
  await db.put("order", JSON.stringify(app.state.cart), "cart");
}

export async function loadDB() {
  const db = await app.openDB();

  //get from the indexdb
  const cart = await db.get("order", "cart");

  if (cart) {
    try {
      app.state.cart = JSON.parse(cart) || [];
    } catch (error) {
      console.error("Error parsing cart", error);
    }
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
