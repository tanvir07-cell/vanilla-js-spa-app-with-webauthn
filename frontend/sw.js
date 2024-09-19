// offline support :

self.addEventListener("install", async (event) => {
  const assets = [
    "/",
    "./app.js",
    "style.css",
    "/services/api.js",
    "/services/idb.js",
    "/services/router.js",
    "/services/state.js",
    "/components/ProductsPage.js",
    "/components/ProductsPage.css",
    "/components/DetailsPage.js",
    "/components/DetailsPage.css",
    "/components/OrderPage.js",
    "/components/OrderPage.css",
    "/components/LoginPage.js",
    "/components/LoginPage.css",
    "/components/RegisterPage.js",
    "/components/RegisterPage.css",

    "/utils/addToCart.js",
    "/utils/getProductById.js",
    "/utils/loadProducts.js",
    "/utils/removeProductById.js",
    "https://cdn.jsdelivr.net/npm/idb@7/build/umd.js",
    "https://fonts.googleapis.com/css?family=Rancho&effect=shadow-multiple|3d-float|fire-animation|neon|outline|emboss|shadow-multiple|shadow-sweep|shadow-w-multiple|shadow-w-super|shadow-amour|shadow-into-light|shadow-into-light-two|shadow-dancer",
    "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200",
    "https://fonts.gstatic.com/s/rancho/v21/46kulbzmXjLaqZRVam_hVUdI1w.woff2",
    "https://accounts.google.com/gsi/client",
    // "https://unpkg.com/@simplewebauthn/browser/dist/bundle/index.umd.min.js",
  ];
  const cache = await caches.open("cm-assets");
  cache.addAll(assets);
});

// for acceccisg the caching cm-assets
// network first strategy.
// self.addEventListener("fetch", async (event) => {
//   event.respondWith(
//     (async () => {
//       try {
//         // network first strategy
//         const fetchResponse = await fetch(event.request);
//         return fetchResponse;
//       } catch (e) {
//         const cachedResponse = await caches.match(event.request);
//         if (cachedResponse) return cachedResponse;
//       }
//     })()
//   );
// });

// state while revalidating the cache

// Fetch event to implement stale-while-revalidate strategy
self.addEventListener("fetch", (event) => {
  event.respondWith(
    (async () => {
      const cache = await caches.open("cm-assets");

      // from the cache;

      const cachedResponse = await cache.match(event.request);

      // Fetch the latest resource from the network
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          // Update the cache with the latest version
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        })
        .catch(() => cachedResponse); // In case of network failure, use cached response

      // return cached immediately and update cache in the background
      return cachedResponse || fetchPromise;
    })()
  );
});

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-test") {
    console.log("sync event fired");
  } else {
    console.log("sync event not fired");
  }
});
