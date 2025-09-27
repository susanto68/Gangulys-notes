const CACHE_NAME = 'sir-ganguly-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/chapters.css',
  '/scripts.js',
  '/icon-192.png',
  '/icon-512.png',
  '/sirganguly.png',
  '/favicon.ico',
  '/class6.html',
  '/class7.html',
  '/class8.html',
  '/class9.html',
  '/class10.html',
  '/class12.html',
  '/Java_program.html',
  '/basic-java-programs.html',
  '/videos.html',
  '/ai.html',
  '/Motivational_Words.html',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css'
];

// Install event - cache resources
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
