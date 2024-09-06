import getProductById from "./getProductById.js";
import { saveDB } from "../services/idb.js"; // Ensure you save the cart after adding

export async function addToCart(id) {
  const product = await getProductById(id);

  if (!app.state.user) {
    console.error("No user is logged in.");
    return;
  }

  const userId = app.state.user.email || app.state.user.id;

  console.log("product", product);
  const results = app.state.cart.filter(
    (prodInCart) => prodInCart.product.id == id
  );

  if (results.length == 1) {
    app.state.cart = app.state.cart.map((p) =>
      p.product.id == id
        ? {
            ...p,
            quantity: p.quantity + 1,
          }
        : p
    );
  } else {
    app.state.cart = [...app.state.cart, { product, quantity: 1 }];
  }

  // Save the updated cart to IndexedDB for this specific user
  await saveDB(userId, app.state.cart);
}
