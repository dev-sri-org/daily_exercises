// Offline support for a member's app. Each member's sw.js just imports this file.
// Pages and plans are fetched fresh when online (so updates show up right away)
// and fall back to the cached copy when offline.
const APP = location.pathname.split("/").slice(-2, -1)[0];  // member folder, e.g. "nanna"
const CACHE = APP + "-v3";
const PRECACHE = ["./", "./exercises.html", "./meals.html", "./manifest.webmanifest",
  "./plans/exercises.json", "./plans/meals.json",
  "../shared/app.css", "../shared/app.js", "../shared/exercises.js", "../shared/meals.js",
  "../shared/icons/heart-192.png", "../shared/icons/bowl-192.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

// All apps on this site share one cache storage, so only clear this app's older caches
self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith(APP + "-") && k !== CACHE).map(k => caches.delete(k))))
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
