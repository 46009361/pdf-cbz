const CACHE = "pdf-cbz-v1";
const PRECACHE = [
    "/pdf-cbz/",
    "/pdf-cbz/index.html",
    "/pdf-cbz/style.css",
    "/pdf-cbz/script.js",
    "/pdf-cbz/node_modules/pdfjs-dist/build/pdf.mjs",
    "/pdf-cbz/node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
    "/pdf-cbz/node_modules/jszip/dist/jszip.min.js",
];

let pendingDownload = null;

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

self.addEventListener("message", (e) => {
    pendingDownload = e.data; // { filename, blob }
});

self.addEventListener("fetch", (e) => {
    const url = new URL(e.request.url);

    if (url.pathname.startsWith("/pdf-cbz/download/")) {
        if (pendingDownload) {
            const { filename, blob } = pendingDownload;
            pendingDownload = null;
            e.respondWith(new Response(blob, {
                headers: {
                    "Content-Type": "application/vnd.comicbook+zip",
                    "Content-Disposition": `attachment; filename="${filename}"`,
                }
            }));
        }
        return;
    }

    e.respondWith(
        caches.match(e.request).then((r) => r ?? fetch(e.request))
    );
});
