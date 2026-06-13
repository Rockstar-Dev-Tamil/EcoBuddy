/**
 * sw.js
 *
 * Service worker implementing basic offline support caching
 * for static web assets (HTML, CSS, JS, manifest, and icons).
 */

const CACHE_NAME = "ecobuddy-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/manifest.json",
  "/logo.png",
  "/favicon.ico"
];

// Install event - Cache core static app shells
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Caching app shell assets");
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate event - Clean up older caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] Removing old cache", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - Cache-first with network fallback strategy
self.addEventListener("fetch", (event) => {
  // Exclude non-GET requests and external API endpoints (like Gemini / Supabase)
  if (
    event.request.method !== "GET" ||
    event.request.url.includes("supabase.co") ||
    event.request.url.includes("googleapis.com") ||
    event.request.url.includes("/api/")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
          return networkResponse;
        }

        // Cache newly fetched assets dynamically
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Return offline shell fallback if network is completely down
        return caches.match("/");
      });
    })
  );
});
