const CACHE_NAME = "evr-portuguese-offline-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.png"
];

// Install: save the app files
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

// Activate: remove old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: use cached files when offline
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then(networkResponse => {

            // Save successful requests for future offline use
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              networkResponse.type === "basic"
            ) {
              const responseClone = networkResponse.clone();

              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
            }

            return networkResponse;
          })
          .catch(() => {
            // If completely offline and nothing is cached,
            // return the main app page.
            return caches.match("./index.html");
          });
      })
  );
});