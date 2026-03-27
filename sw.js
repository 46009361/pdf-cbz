const CACHE = "pdf-cbz-v1";
const PRECACHE = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "/node_modules/pdfjs-dist/build/pdf.mjs",
  "/node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
  "/node_modules/jszip/dist/jszip.min.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((r) => r ?? fetch(e.request))
  );
});
