/* Ministerio Teocrático PWA v10.5 — actualización automática y modo sin conexión */
const CACHE_NAME = 'ministerio-teocratico-v10-5';
const CACHE_PREFIX = 'ministerio-teocratico-';
const APP_SHELL = [
  './', './index.html', './manifest.webmanifest', './icon-192.png',
  './icon-512.png', './apple-touch-icon.png', './favicon-32.png',
  './Idiomas/es.xml', './Idiomas/en.xml'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(APP_SHELL.map(async path => {
      try {
        const url = new URL(path, self.registration.scope);
        const response = await fetch(new Request(url, { cache: 'reload' }));
        if (response.ok) await cache.put(url, response);
      } catch (_) { /* Se instalará también sin conexión con lo que ya exista. */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // La página principal se solicita primero a Internet para recibir la versión más reciente.
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request, { cache: 'no-store' });
        if (response && response.ok) await cache.put(new URL('./index.html', self.registration.scope), response.clone());
        return response;
      } catch (_) {
        return (await cache.match(request)) ||
          (await cache.match(new URL('./index.html', self.registration.scope))) ||
          new Response('Conéctate a Internet y abre la aplicación una vez para prepararla sin conexión.', { status: 503 });
      }
    })());
    return;
  }

  // Recursos: entrega la copia local rápidamente y actualiza la caché en segundo plano.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    const networkUpdate = fetch(request).then(response => {
      if (response && response.ok && response.type === 'basic') cache.put(request, response.clone());
      return response;
    });
    if (cached) {
      event.waitUntil(networkUpdate.catch(() => {}));
      return cached;
    }
    try { return await networkUpdate; }
    catch (_) { return new Response('', { status: 504 }); }
  })());
});

self.addEventListener('message', event => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') self.skipWaiting();
  if (data.type === 'SHOW_NOTIFICATION' && data.title) {
    event.waitUntil(self.registration.showNotification(data.title, {
      body: data.body || '', icon: './icon-192.png', badge: './icon-192.png',
      tag: data.tag || 'ministerio-' + Date.now(), renotify: false,
      data: { url: './index.html' }
    }));
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if ('focus' in client) { await client.focus(); return; }
    }
    if (self.clients.openWindow) await self.clients.openWindow('./index.html');
  })());
});
