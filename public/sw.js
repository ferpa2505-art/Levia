/* Service worker do Leviã: deixa o app abrir mesmo sem internet. */
const CACHE = 'levia-v2';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', '/manifest.webmanifest'])));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(nomes.filter((n) => n !== CACHE).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const informada = event.notification?.data?.url;
      let destino;
      try {
        destino = new URL(typeof informada === 'string' ? informada : '/', self.location.origin);
      } catch {
        destino = new URL('/', self.location.origin);
      }
      if (destino.origin !== self.location.origin) destino = new URL('/', self.location.origin);

      const janelas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const janela = janelas.find((c) => c.url.startsWith(self.location.origin));
      if (janela) {
        await janela.focus();
        if ('navigate' in janela && janela.url !== destino.href) await janela.navigate(destino.href);
      } else {
        await self.clients.openWindow(destino.href);
      }
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  // Páginas: tenta a internet primeiro (pega versão nova); sem internet, usa a guardada.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((resp) => {
          const copia = resp.clone();
          caches.open(CACHE).then((c) => c.put('/', copia));
          return resp;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // Arquivos do app (JS, imagens, fontes): usa o guardado; se não tiver, baixa e guarda.
  event.respondWith(
    caches.match(req).then(
      (salvo) =>
        salvo ||
        fetch(req).then((resp) => {
          if (resp.ok) {
            const copia = resp.clone();
            caches.open(CACHE).then((c) => c.put(req, copia));
          }
          return resp;
        })
    )
  );
});
