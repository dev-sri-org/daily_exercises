// Service worker logic shared by the apps. Each app's sw.js sets self.APP and self.PRECACHE, then imports this.
// Pages and plans are fetched fresh when online (so updates show up right away)
// and fall back to the cached copy when offline.
const CACHE = self.APP + "-v2";

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(self.PRECACHE)).then(() => self.skipWaiting()));
});

// All apps share one cache storage, so only clear this app's older caches
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith(self.APP + "-") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;  // videos stream from YouTube
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
