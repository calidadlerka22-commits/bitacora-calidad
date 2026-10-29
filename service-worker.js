const CACHE_NAME = "bitacora-calidad-v20";
const APP_SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.svg", "./icons/icon-512.svg"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  // Nunca interceptar ni almacenar respuestas de Supabase, CDN ni otros servidores.
  // La base de datos siempre debe consultarse en la red.
  if (url.origin !== self.location.origin) return;
  // Solo usar caché para el shell estático de la aplicación.
  const isAppShell = request.mode === "navigate" ||
    /\\.(html|css|js|webmanifest|svg|png|ico)$/i.test(url.pathname);
  if (!isAppShell) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(request, { cache: "no-store" });
      if (response && response.status === 200) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy)).catch(() => {});
      }
      return response;
    } catch (error) {
      const cached = await caches.match(request);
      return cached || caches.match("./index.html");
    }
  })());
});