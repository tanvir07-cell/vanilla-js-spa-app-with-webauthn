const STATE = {
  products: [],
  cart: [],
  user: null,
};

const proxiedStore = new Proxy(STATE, {
  set: (target, property, value) => {
    target[property] = value;

    if (property === "products") {
      globalThis.dispatchEvent(new Event("app:products-updated"));
    }

    if (property === "cart") {
      globalThis.dispatchEvent(new Event("app:cart-updated"));
    }

    if (property === "user") {
      globalThis.dispatchEvent(new Event("app:user-updated"));
    }

    return true;
  },

  get: (target, property) => {
    return target[property];
  },
});

export default proxiedStore;
