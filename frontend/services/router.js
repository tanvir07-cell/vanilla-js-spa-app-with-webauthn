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

  navigate: function (path, addToHistory = true) {
    const main = document.querySelector("main");
    console.log("going to", path);
    if (addToHistory) {
      history.pushState({ path }, null, path);
    }

    if (path === "/") {
      if (document.startViewTransition) {
        document.startViewTransition();
      }
      const productsPage = document.createElement("products-page");

      main.innerHTML = "";
      main.appendChild(productsPage);
    }

    if (path === "/order") {
      if (document.startViewTransition) {
        document.startViewTransition();
      }

      const orderPage = document.createElement("order-page");
      main.innerHTML = "";
      main.appendChild(orderPage);
    }

    if (path.startsWith("/details-")) {
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
      if (document.startViewTransition) {
        document.startViewTransition();
      }

      const loginPage = document.createElement("login-page");
      main.innerHTML = "";
      main.appendChild(loginPage);
    }

    if (path === "/register") {
      if (document.startViewTransition) {
        document.startViewTransition();
      }

      const registerPage = document.createElement("register-page");
      main.innerHTML = "";
      main.appendChild(registerPage);
    }
  },
};

export default router;
