// Juvibox Admin — Service Worker mínimo
// Su función principal es hacer la app instalable como PWA.
// Como la app depende del servidor (SQLite + Server Actions),
// no cacheamos contenido dinámico; sólo los íconos de la app.

const CACHE = "juvibox-static-v1";
const ASSETS = [
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Sólo manejamos GET; el resto pasa directo a la red
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Estrategia cache-first para íconos
  if (url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req))
    );
    return;
  }
  // Resto: red directamente (la app necesita servidor)
});
