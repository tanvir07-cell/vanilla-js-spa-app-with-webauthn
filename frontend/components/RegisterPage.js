import router from "../services/router.js";
import ServerApi from "../services/ServerApi.js";

export class RegisterPage extends HTMLElement {
  constructor() {
    super();

    this.root = this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.setAttribute("type", "text/css");

    this.root.appendChild(style);

    async function loadCSS() {
      const css = await fetch("components/RegisterPage.css");
      style.textContent = await css.text();
    }
    loadCSS();
  }

  connectedCallback() {
    const template = document.getElementById("register-page-template");
    this.root.appendChild(template.content.cloneNode(true));

    // Create and append the toast-message element to the shadow DOM
    const toast = document.createElement("toast-message");

    // insert toast component to the register page shadow dom
    this.root.appendChild(toast);
    this.toast = toast;

    this.render();
  }

  render() {
    const form = this.root.querySelector("form");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const registerBtn = this.root.querySelector("#register-btn");
      registerBtn.textContent = "Registering...";
      registerBtn.disabled = true;

      const formData = new FormData(e.target);

      const user = {
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
      };

      try {
        const res = await ServerApi.register(user);

        if (res.ok) {
          this.toast.root.querySelector(".toast").style.color = "#fff";
          this.toast.root.querySelector(".toast").style.backgroundColor =
            "#69BA6C";
          this.toast.showMessage(res.message);

          // Optionally redirect or clear the form after success
        } else {
          this.toast.root.querySelector(".toast").style.backgroundColor =
            "#C51B51";
          this.toast.showMessage(res.message || "Registration failed");
        }
      } catch (error) {
        this.toast.root.querySelector(".toast").style.backgroundColor =
          "#C51B51";
        this.toast.showMessage("An error occurred. Please try again.");
      } finally {
        // Always reset the button state regardless of success or failure
        registerBtn.textContent = "Register";
        registerBtn.disabled = false;
      }
    });
  }
}

customElements.define("register-page", RegisterPage);
