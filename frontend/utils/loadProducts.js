import API from "../services/api.js";
import STATE from "../services/state.js";

export const loadProducts = async () => {
  const products = await API.fetchProducts();
  STATE.products = products;
};
