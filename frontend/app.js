// set the state to the global:

import router from "./services/router.js";
import STATE from "./services/state.js";
navigator.serviceWorker.register("/sw.js");

import Auth from "./services/LoginWithGoogle.js";

// for web components:

import { ProductsPage } from "./components/ProductsPage.js";
import { DetailsPage } from "./components/DetailsPage.js";
import { ToastMessage } from "./components/ToastMessage.js";

import { loadDB, loadProductDB, openDB, saveDB } from "./services/idb.js";

globalThis.app = {
  state: STATE,
  router,
  openDB,
};

globalThis.addEventListener("app:user-updated", () => {
  console.log("user updated");

  const loginSpan = document.getElementById("login-user");

  loginSpan.style.display = "block";
  loginSpan.textContent =
    app.state?.user?.id || app.state?.user?.email || app.state?.user?.picture;

  if (app.state.user) {
    document.querySelector(".hide-login").style.display = "none";
    document.querySelector(".logout").style.display = "block";
  }
});

globalThis.addEventListener("DOMContentLoaded", async () => {
  // logout:
  const logout = document.querySelector(".logout");
  console.log(logout);
  logout.addEventListener("click", () => {
    if (window.PasswordCredential) {
      navigator.credentials.preventSilentAccess();
    }
    // trigger the global user state:
    app.state.user = null;
    document.querySelector(".hide-login").style.display = "block";
    document.getElementById("login-user").style.display = "none";
    logout.style.display = "none";
  });

  // Check if the login page component exists

  // Access the shadow root of the login page component

  if (window.PasswordCredential) {
    const credentials = await navigator.credentials.get({ password: true });

    try {
      app.state.user = credentials;

      // const loginSpan = document.getElementById("login-user");
      // loginSpan.style.display = "block";
      // loginSpan.textContent = app.state.user.id || "GUEST USER";

      console.log(document.querySelector(".hide-login"));
    } catch (e) {
      console.log("from credentials:", e);
    }
  }

  // load products from network and indexdb and store it to the app.state.products array
  await loadProductDB();

  // load cart from the indexdb:
  async function onUserLogin() {
    const userId = app.state.user?.email || app.state.user?.id;

    if (userId) {
      // Load the user's cart
      await loadDB(userId);
    } else {
      console.error("User ID is not available.");
    }

    // You may want to re-render the cart UI here
  }

  await onUserLogin();

  // Update the cart badge on initial load
  updateCartBadge();

  // load the routes:
  app.router.init();
});

let deferredPrompt;

globalThis.addEventListener("beforeinstallprompt", (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  // Update UI to show the download button
  const downloadButton = document.getElementById("downloadButton");
  if (downloadButton) {
    downloadButton.style.display = "block";
  }
});

document.getElementById("downloadButton").addEventListener("click", (e) => {
  // Hide the download button
  e.preventDefault();
  const downloadButton = document.getElementById("downloadButton");
  if (downloadButton) {
    downloadButton.style.display = "none";
  }

  // Show the install prompt
  if (deferredPrompt) {
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the install prompt");
      } else {
        console.log("User dismissed the install prompt");
      }
      deferredPrompt = null;
    });
  }
});

function updateCartBadge() {
  const badge = document.querySelector("#badge");
  const qty = app.state.cart.reduce((acc, item) => acc + item.quantity, 0);
  badge.textContent = qty;
  badge.hidden = qty === 0;
}

// Update the badge when the cart is updated
globalThis.addEventListener("app:cart-updated", () => {
  updateCartBadge();
});

// storage persistence:
// we want to persist the data
// alltime because we know when we are not connected to our
// website for so long then the browser will remove the data on the storage
// so we want to persist the data all the time:

(async function () {
  if (navigator.storage && navigator.storage.persist) {
    if (!(await navigator.storage.persisted())) {
      const result = await navigator.storage.persist();
      console.log(`Was Persistent Storage Request granted? ${result}`);
    } else {
      console.log(`Persistent Storage already granted`);
    }
  }
})();

(async function () {
  if (navigator.storage && navigator.storage.estimate) {
    const q = await navigator.storage.estimate();
    console.log(`quota available: ${parseInt(q.quota / 1024 / 1024)}MiB`);
    console.log(`quota usage: ${q.usage / 1024}KiB`);
  }
})();
