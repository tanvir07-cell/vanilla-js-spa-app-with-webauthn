const API = {
  url: "https://dummyjson.com/products",
  fetchProducts: async function () {
    const response = await fetch(this.url);
    const data = await response.json();
    return data.products;
  },
};

export default API;
