const CACHE_NAME = 'yanacaq-pwa-v1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './firebase.js'
];

// Quraşdırma və faylları yaddaşa (cache) yığma
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Sorğuları idarə etmə
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});