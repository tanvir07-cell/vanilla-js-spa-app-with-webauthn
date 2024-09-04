import { saveDB } from "../services/idb.js";
import { addToCart } from "../utils/addToCart.js";

export class ProductsPage extends HTMLElement {
  constructor() {
    super();

    // shadow dom:

    this.root = this.attachShadow({ mode: "open" });

    // for style:
    const style = document.createElement("style");
    style.setAttribute("type", "text/css");

    this.root.appendChild(style);

    async function loadCSS() {
      const css = await fetch("components/ProductsPage.css");
      style.textContent = await css.text();
    }
    loadCSS();
  }

  connectedCallback() {
    const template = document.getElementById("products-page-template");
    const content = template.content.cloneNode(true);
    this.root.appendChild(content);

    globalThis.addEventListener("app:products-updated", () => {
      this.render();
    });

    // initially load the data:
    this.render();
  }

  render() {
    const products = app.state.products;
    const productsList = this.root.querySelector("#products");

    productsList.innerHTML = "";

    if (products.length === 0) {
      productsList.innerHTML = `<div class = "loader-container"><div class="loader"></div></div>`;
    } else {
      products.forEach((product) => {
        const productItem = document.createElement("li");
        productItem.innerHTML = `
        <div class = "product"
        
        onClick="app.state.user ? app.router.navigate('/details-${
          product.id
        }'): app.router.navigate('/login')"

        >
            <img
            src=${product.thumbnail}

             
            />
            <h2>${product.title}</h2>
            <p>${product.description.slice(0, 50).concat("...")}</p>
            <p>$ ${product.price}</p>
            <button data-id="${
              product.id
            }" class="dark-blue-mesh glass">Add to cart</button>
          </div>

            `;
        // Prevent button click from triggering the parent div's onClick event
        const button = productItem.querySelector("button");

        if (!app.state.user) {
          button.disabled = true;
          button.style.cursor = "not-allowed";
          button.title = "Please log in to add items to your cart";
        }

        button.addEventListener("click", async (event) => {
          event.stopPropagation();
          const productId = event.currentTarget.dataset.id;

          // add to cart:
          const data = await addToCart(productId);
          console.log(data);

          // localStorage.setItem("cart", JSON.stringify(app.state.cart));

          saveDB();
        });

        productsList.appendChild(productItem);
      });
    }
  }
}

customElements.define("products-page", ProductsPage);
