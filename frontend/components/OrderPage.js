import { saveDB } from "../services/idb.js";
import { removeFromCart } from "../utils/removeProductById.js";

export class OrderPage extends HTMLElement {
  // private property
  #user = {
    name: "",
    phone: "",
    email: "",
  };

  constructor() {
    super();

    this.root = this.attachShadow({ mode: "open" });

    // css:
    const style = document.createElement("style");
    this.root.appendChild(style);

    async function loadCSS() {
      const css = await fetch("components/OrderPage.css");
      style.textContent = await css.text();
    }

    loadCSS();
  }

  connectedCallback() {
    const template = document.getElementById("order-page-template");
    const content = template.content.cloneNode(true);
    this.root.appendChild(content);

    // Set up the model binding.
    this.bindModalEvents();

    this.render();

    globalThis.addEventListener("app:cart-updated", () => {
      this.render();
    });
  }

  render() {
    this.setFormBindings(this.root.querySelector("form"));

    const cart = app.state.cart;
    const orderList = this.root.querySelector("#order-list");

    orderList.innerHTML = ""; // Clear the list

    if (cart.length === 0) {
      orderList.innerHTML = `<div class="empty-cart">Your cart is empty</div>`;
    } else {
      // Use a Map to keep track of the quantity for each product
      const productMap = new Map();

      cart.forEach((item) => {
        if (productMap.has(item.product.id)) {
          // If the product is already in the map, update the quantity
          const existingItem = productMap.get(item.product.id);
          existingItem.quantity += item.quantity;
        } else {
          // If the product is not in the map, add it
          productMap.set(item.product.id, { ...item });
        }
      });

      // Now iterate over the productMap to display each product once
      productMap.forEach((item) => {
        const orderItem = document.createElement("li");
        orderItem.classList.add("glass");
        orderItem.classList.add("dark-blue-mesh");
        orderItem.innerHTML = `
          <img src=${item.product.thumbnail} />
          <h2>${item.product.title.slice(0, 20).concat("...")}</h2>
          <p>$ ${item.product.price}</p>
          <p>Qty: ${item.quantity}x</p>
          <a href="#" data-id="${item.product.id}">
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed">
              <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/>
            </svg>
          </a>
        `;

        // Add event listener to each delete button
        const deleteButton = orderItem.querySelector("a");
        deleteButton.addEventListener("click", async (e) => {
          e.preventDefault();
          const productId = e.currentTarget.getAttribute("data-id");
          removeFromCart(productId);
        });

        orderList.appendChild(orderItem); // Append each unique item to the list
      });
    }

    const total = cart.reduce(
      (acc, item) => acc + item.product.price * item.quantity,
      0
    );
    const totalDiv = this.root.querySelector("#total");
    totalDiv.textContent = `Total: $${total.toFixed(2)}`;
  }

  setFormBindings(form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      this.showModal("Order submitted successfully.");
      this.#user.name = "";
      this.#user.email = "";
      this.#user.phone = "";

      // clear the cart and call the cart proxy
      app.state.cart = [];

      // clear the localstorage:
      saveDB();
    });

    Array.from(form.elements).forEach((element) => {
      if (element.type === "submit") {
        if (app.state.cart.length === 0) {
          element.disabled = true;
          element.style.opacity = 0.5;
          element.style.cursor = "not-allowed";
        }
      }
      if (element.name) {
        element.addEventListener("change", (event) => {
          // call the set proxy
          this.#user[element.name] = element.value;
        });
      }
    });
    this.#user = new Proxy(this.#user, {
      set(target, property, value) {
        target[property] = value;
        form.elements[property].value = value;
        return true;
      },
    });
  }

  bindModalEvents() {
    const modal = this.root.querySelector("#modal");
    const closeModal = this.root.querySelector(".close-btn");
    const okButton = this.root.querySelector("#modal-ok-btn");

    closeModal.addEventListener("click", () => {
      modal.classList.add("hidden");
    });

    okButton.addEventListener("click", () => {
      modal.classList.add("hidden");
    });
  }

  showModal(message) {
    const modal = this.root.querySelector("#modal");
    const modalMessage = this.root.querySelector("#modal-message");

    modalMessage.textContent = message;
    modal.classList.remove("hidden");
  }
}

customElements.define("order-page", OrderPage);
