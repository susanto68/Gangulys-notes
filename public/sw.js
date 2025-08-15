// Service Worker for Avatar AI Assistant PWA
// Created by Susanto Ganguly (Sir Ganguly)

const CACHE_NAME = 'avatar-ai-v1.0.0';
const STATIC_CACHE = 'avatar-ai-static-v1.0.0';
const DYNAMIC_CACHE = 'avatar-ai-dynamic-v1.0.0';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png',
  '/assets/avatars/computer-teacher.png',
  '/assets/avatars/english-teacher.png',
  '/assets/avatars/mathematics-teacher.png',
  '/assets/avatars/physics-teacher.png',
  '/assets/avatars/chemistry-teacher.png',
  '/assets/avatars/biology-teacher.png',
  '/assets/avatars/history-teacher.png',
  '/assets/avatars/geography-teacher.png',
  '/assets/avatars/hindi-teacher.png',
  '/assets/avatars/doctor.png',
  '/assets/avatars/engineer.png',
  '/assets/avatars/lawyer.png'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('📦 Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('✅ Service Worker installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated successfully');
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('❌ Service Worker activation failed:', error);
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API calls (they should always go to network)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Handle different types of requests
  if (request.destination === 'image') {
    // Cache images with network-first strategy
    event.respondWith(handleImageRequest(request));
  } else if (request.destination === 'document' || request.destination === '') {
    // Cache HTML pages with network-first strategy
    event.respondWith(handleDocumentRequest(request));
  } else {
    // Cache other resources with cache-first strategy
    event.respondWith(handleResourceRequest(request));
  }
});

// Handle image requests (network-first)
async function handleImageRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache the response
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('🌐 Network failed for image, trying cache');
  }

  // Fallback to cache
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Return a placeholder image if nothing is cached
  return new Response('Image not available', { status: 404 });
}

// Handle document requests (network-first)
async function handleDocumentRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      // Cache the response
      const cache = await caches.open(DYNAMIC_CACHE)
      cache.put(request, networkResponse.clone())
      return networkResponse
    }
  } catch (error) {
    console.log('🌐 Network failed for document, trying cache')
  }

  // Fallback to cache
  const cachedResponse = await caches.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  // Return offline page for navigation requests
  if (request.mode === 'navigate') {
    return caches.match('/offline.html')
  }

  // Return offline page
  return caches.match('/offline.html')
}

// Handle resource requests (cache-first)
async function handleResourceRequest(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    // Try network if not in cache
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache the response
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('🌐 Network failed for resource');
  }

  return new Response('Resource not available', { status: 404 });
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Handle background sync
async function doBackgroundSync() {
  try {
    console.log('🔄 Performing background sync...');
    // You can add offline functionality here later
    // For example, syncing chat messages when back online
  } catch (error) {
    console.error('❌ Background sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('📱 Push notification received');
  
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'New message from your AI Avatar',
      icon: '/assets/icons/icon-192x192.png',
      badge: '/assets/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      },
      actions: [
        {
          action: 'explore',
          title: 'Open App',
          icon: '/assets/icons/icon-72x72.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/assets/icons/icon-72x72.png'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Avatar AI Assistant', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notification clicked:', event.notification.tag);
  
  event.notification.close();

  if (event.action === 'explore') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Handle app installation
self.addEventListener('appinstalled', (event) => {
  console.log('📱 App installed successfully');
  // You can add analytics or other tracking here
});

console.log('🎯 Service Worker script loaded');
