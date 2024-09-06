const router = {
  init: function () {
    const routes = document.querySelectorAll("a.navlink");
    routes.forEach((route) => {
      route.addEventListener("click", (e) => {
        e.preventDefault();
        const path = e.target.getAttribute("href");
        this.navigate(path);
      });
    });

    globalThis.addEventListener("popstate", (e) => {
      this.navigate(e.state.path, false);
    });

    // current location

    this.navigate(location.pathname);
  },

  setMetaData: (title, color) => {
    document.title = `${title}`;
    document.querySelector("meta[name=theme-color]").content = color;
  },

  navigate: async function (path, addToHistory = true) {
    const main = document.querySelector("main");
    console.log("going to", path);
    if (addToHistory) {
      history.pushState({ path }, null, path);
    }

    if (path === "/") {
      router.setMetaData("Home", "#0063d0");
      if (document.startViewTransition) {
        document.startViewTransition();
      }
      const productsPage = document.createElement("products-page");

      main.innerHTML = "";
      main.appendChild(productsPage);
    }

    if (path === "/order") {
      router.setMetaData("Order", "#0063d0");

      if (document.startViewTransition) {
        document.startViewTransition();
      }
      await import("../components/OrderPage.js");
      const orderPage = document.createElement("order-page");
      main.innerHTML = "";
      main.appendChild(orderPage);
    }

    if (path.startsWith("/details-")) {
      router.setMetaData("Details", "red");

      if (document.startViewTransition) {
        document.startViewTransition();
      }

      const id = path.split("-")[1];
      const detailsPage = document.createElement("details-page");
      detailsPage.dataset.id = id;
      main.innerHTML = "";
      main.appendChild(detailsPage);
    }

    if (path === "/login") {
      router.setMetaData("Login", "green");

      if (document.startViewTransition) {
        document.startViewTransition();
      }
      await import("../components/LoginPage.js");

      const loginPage = document.createElement("login-page");
      main.innerHTML = "";
      main.appendChild(loginPage);
    }

    if (path === "/register") {
      router.setMetaData("Register", "blue");

      if (document.startViewTransition) {
        document.startViewTransition();
      }
      await import("../components/RegisterPage.js");
      const registerPage = document.createElement("register-page");
      main.innerHTML = "";
      main.appendChild(registerPage);
    }
  },
};

export default router;
