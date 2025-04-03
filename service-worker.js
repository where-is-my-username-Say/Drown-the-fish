const CACHE_NAME = 'photo-hunt-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/fish.jpg',
  '/BGV.mp4',
  '/dmg.mp3',
  '/BG.mp3',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request)
      .then(response => response || fetch(e.request))
  );
});