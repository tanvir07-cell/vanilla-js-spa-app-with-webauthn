import router from "../services/router.js";
import ServerApi from "../services/ServerApi.js";

export class LoginPage extends HTMLElement {
  constructor() {
    super();

    this.root = this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.setAttribute("type", "text/css");

    this.root.appendChild(style);

    async function loadCSS() {
      const css = await fetch("components/LoginPage.css");
      style.textContent = await css.text();
    }
    loadCSS();

    // Create and append Google Sign-In script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    this.shadowRoot.appendChild(script);

    // Set up Google Sign-In button after script loads
    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id:
          "256188221923-7v2501mrds8ns2lispkg5tmtd8ssoa4s.apps.googleusercontent.com",
        callback: loginFromGoogle, // or bind it to your component context
      });

      window.google.accounts.id.renderButton(
        this.shadowRoot.querySelector(".g_id_signin"),
        { theme: "outline", size: "large" }
      );
    };
  }

  async connectedCallback() {
    const template = document.getElementById("login-page-template");
    this.root.appendChild(template.content.cloneNode(true));

    const toast = document.createElement("toast-message");
    this.root.appendChild(toast);
    this.toast = toast;

    if (window.PasswordCredential) {
      const credentials = await navigator.credentials.get({ password: true });
      try {
        this.root.getElementById("login_email").value = credentials.id;
        this.root.getElementById("login_password").value = credentials.password;
      } catch (e) {}
    }
    const webauthnField = this.root.getElementById("section_webauthn");
    const passwordField = this.root.getElementById("login_section_password");
    const email = this.root.getElementById("login_email");

    webauthnField.addEventListener("click", async (e) => {
      e.preventDefault();
      Auth.webAuthnLogin(email);
    });

    this.render();
  }

  render() {
    const form = this.root.querySelector("form");
    const registerText = this.root.querySelector("p a");
    console.log(this.root.getElementById("login_section_password"));
    const passwordField = this.root.getElementById("login_section_password");
    const email = this.root.getElementById("login_email");
    const webauthnField = this.root.getElementById("section_webauthn");

    const addWebAuthn = this.root.getElementById("add-webauthn");

    // addWebAuthn.addEventListener("click", async (e) => {
    //   e.preventDefault();
    //   Auth.addWebAuthn();
    // });

    // function init() {
    //   Auth.loginStep = 1;
    //   passwordField.hidden = true;
    //   webauthnField.hidden = true;
    // }

    // init();

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (Auth.loginStep == 1) {
        Auth.checkAuthOptions(email, passwordField, webauthnField);
        return;
      }
      const formData = new FormData(e.target);

      const user = {
        email: formData.get("email"),
        password: formData.get("password"),
      };

      const res = await ServerApi.login(user);
      console.log(res);
      app.state.user = res.user;

      if (res.ok && res.user) {
        this.toast.root.querySelector(".toast").style.color = "#fff";
        this.toast.root.querySelector(".toast").style.backgroundColor =
          "#69BA6C";
        this.toast.showMessage(res.message);

        setTimeout(() => {
          router.navigate("/");
        }, 1 * 1000);

        // router.navigate("/");
      } else {
        this.toast.root.querySelector(".toast").style.backgroundColor =
          "#C51B51";
        this.toast.showMessage(res.message);

        //save the fedarated login:

        if (window.PasswordCredential && user.password) {
          const credential = new PasswordCredential({
            name: res.user.name,
            id: user.email,
            password: user.password,
          });
          navigator.credentials.store(credential);
        }
      }

      Auth.account = {
        email: res.user.email,
        name: res.user.name,
      };

      console.log("login", Auth.account);
    });

    registerText.addEventListener("click", (e) => {
      e.preventDefault();
      router.navigate("/register");
    });
  }
}

customElements.define("login-page", LoginPage);
