import { saveDB } from "../services/idb.js";
import { addToCart } from "../utils/addToCart.js";
import getProductById from "../utils/getProductById.js";

export class DetailsPage extends HTMLElement {
  constructor() {
    super();

    this.root = this.attachShadow({ mode: "open" });

    // css:
    const style = document.createElement("style");
    this.root.appendChild(style);

    async function loadCSS() {
      const css = await fetch("components/DetailsPage.css");
      style.textContent = await css.text();
    }

    loadCSS();
  }

  connectedCallback() {
    const template = document.getElementById("details-page-template");
    const content = template.content.cloneNode(true);
    this.root.appendChild(content);

    this.render();

    globalThis.addEventListener("app:cart-updated", () => {
      this.render(); // Re-render when the cart is updated
    });
  }

  render() {
    const detailsDiv = this.root.querySelector("#details");
    const id = this.dataset.id;
    detailsDiv.innerHTML = "";
    console.log(id);

    async function getProduct() {
      const product = await getProductById(id);

      if (product) {
        detailsDiv.innerHTML = `
          <div class="product">
            <img src=${product.thumbnail} />
            <h2>${product.title}</h2>
            <p>${product.description}</p>
            <p>$ ${product.price}</p>
            <button class="dark-blue-mesh glass" data-id="${product.id}"
            >Add to cart</button>
          </div>
        `;

        const btn = detailsDiv.querySelector("button");
        btn.addEventListener("click", async (e) => {
          await addToCart(product.id);

          saveDB();

          setTimeout(() => {
            app.router.navigate("/order");
          }, 100);
        });
      } else {
        detailsDiv.innerHTML = `<h2>Product not found</h2>`;
      }
    }

    getProduct();
  }
}

customElements.define("details-page", DetailsPage);
