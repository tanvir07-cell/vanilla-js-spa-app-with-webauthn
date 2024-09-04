import { saveDB } from "../services/idb.js";

export function removeFromCart(id) {
  app.state.cart = app.state.cart.filter(
    (prodInCart) => prodInCart.product.id != id
  );

  saveDB();
}
