const CACHE_NAME = "timeflow-v5";

// Install: skip waiting immediately, no pre-caching (avoids addAll failures)
self.addEventListener("install", () => self.skipWaiting());

// Activate: clear old caches
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch: only intercept same-origin GET requests
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);

  // Never intercept cross-origin requests (API, fonts, etc.)
  if (url.origin !== self.location.origin) return;

  // Only cache GET
  if (e.request.method !== "GET") return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return response;
      });
    })
  );
});
