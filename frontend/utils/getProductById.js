import { loadProducts } from "./loadProducts.js";

const getProductById = async (id) => {
  if (app.state.products.length === 0) {
    await loadProducts();
  }

  for (let product of app.state.products) {
    if (product.id === Number(id)) {
      return product;
    }
  }
  return null;
};

export default getProductById;
