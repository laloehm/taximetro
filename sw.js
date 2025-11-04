// sw.js
const CACHE_NAME = 'taximetro-pwa-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com', // Cachar Tailwind CSS
  // Si tienes iconos, inclúyelos aquí:
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
  // Añade aquí cualquier otro recurso estático que quieras cachear (imágenes, fuentes, etc.)
];

// Evento 'install': Se ejecuta cuando el Service Worker se instala por primera vez.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Fuerza la activación del nuevo SW inmediatamente
  );
});

// Evento 'activate': Se ejecuta cuando el Service Worker se activa.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Permite que el SW tome control de la página
  );
});

// Evento 'fetch': Intercepta las solicitudes de red.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si el recurso está en caché, lo devuelve
        if (response) {
          return response;
        }
        // Si no está en caché, lo busca en la red
        return fetch(event.request)
          .then(networkResponse => {
            // Si la respuesta de red es válida, la cachea y la devuelve
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return networkResponse;
          })
          .catch(() => {
            // Esto se ejecuta si la red falla y no hay caché
            console.log('Fetch failed and no cache for:', event.request.url);
            // Aquí podrías servir una página offline específica si lo deseas
            // return caches.match('/offline.html'); 
          });
      })
  );
});