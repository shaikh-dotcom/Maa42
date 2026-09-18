// Minimal service worker for PWA installability.
//
// Deliberately NOT a heavy offline-caching strategy: this app shows live
// clinical data (vitals, chat, MaterniBot sensor readings), so caching API
// responses could show a user stale/wrong health information while
// offline. This service worker only caches the static app shell (HTML/CSS/
// JS) so the app can install and open instantly — every /api/* call and
// every Firestore request always goes to the network, never the cache.

const CACHE_NAME = "maa42-shell-v1";
const SHELL_ASSETS = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Never intercept API calls or cross-origin requests (Firestore, Groq,
  // MaterniBot, etc.) — always hit the network for these.
  if (
    url.pathname.startsWith("/api/") ||
    url.origin !== self.location.origin
  ) {
    return;
  }

  // Network-first for everything else, falling back to the cached shell
  // only when genuinely offline — so a normal visit always gets the latest
  // build, and offline just gets "the app opens" rather than a blank page.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});
