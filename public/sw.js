const CACHE_NAME = "mswd-slp-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/favicon.ico",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png"
];

// Install Event - Pre-cache basic static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event - Clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Cache-first with Network Fallback (for assets and static files)
self.addEventListener("fetch", (event) => {
  // Skip cross-origin and POST requests
  if (!event.request.url.startsWith(self.location.origin) || event.request.method !== "GET") {
    return;
  }

  // Skip supabase database/auth API paths so we don't cache database operations
  if (event.request.url.includes("/api/") || event.request.url.includes("/supabase/")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Cache static JS/CSS bundles and assets dynamically as the user navigates
        if (
          response.status === 200 &&
          (event.request.url.includes("/_next/static/") ||
           event.request.url.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js)$/))
        ) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      }).catch(() => {
        // Fallback or handle offline
      });
    })
  );
});
