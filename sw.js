// Offline support: cache the app shell, fall back to cache when offline.
const CACHE = "miavion-v2";
const SHELL = ["./", "index.html", "css/app.css", "js/data.js", "js/land.js", "js/sim.js", "js/provider.js", "js/globe.js", "js/app.js", "icon.svg", "manifest.webmanifest",
  "https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.hostname.endsWith("rapidapi.com")) return;
  e.respondWith(
    // Always check the network for a newer version first (bypassing the
    // browser's short-term cache); use the saved copy only when offline.
    (e.request.mode === "navigate" ? fetch(e.request.url, { cache: "no-cache" }) : fetch(e.request, { cache: "no-cache" })).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request))
  );
});
