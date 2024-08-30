const CACHE_NAME = 'photo-hunt-cache-v1';
const URLs_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/BGV.mp4',
  '/fish.jpg',
  '/dmg.mp3',
  '/BG.mp3',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(URLs_TO_CACHE);
      })
  );
});

// Fetch event - respond with cached assets or fetch from network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Return cached response if available
        }
        return fetch(event.request); // Fetch from network if not cached
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName); // Delete old caches
          }
        })
      );
    })
  );
});
