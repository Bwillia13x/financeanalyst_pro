/**
 * Service Worker for FinanceAnalyst Pro
 * Handles caching, offline functionality, and push notifications
 */

const CACHE_NAME = 'financeanalyst-v1';
const STATIC_CACHE = 'financeanalyst-static-v1';
const API_CACHE = 'financeanalyst-api-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/offline.html'
];

// API endpoints to cache
const API_ENDPOINTS = ['/api/market-data', '/api/portfolio', '/api/user/preferences'];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker installing');

  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),

      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating');

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE && cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),

      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle different types of requests
  if (request.method === 'GET') {
    if (isStaticAsset(request.url)) {
      event.respondWith(handleStaticRequest(request));
    } else if (isAPIRequest(request.url)) {
      event.respondWith(handleAPIRequest(request));
    } else if (isImageRequest(request.url)) {
      event.respondWith(handleImageRequest(request));
    } else {
      event.respondWith(handleDefaultRequest(request));
    }
  }
});

// Push event - handle push notifications
self.addEventListener('push', event => {
  console.log('Push message received:', event);

  let data = {};

  if (event.data) {
    data = event.data.json();
  }

  const options = {
    body: data.body || 'New notification from FinanceAnalyst Pro',
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/icon-192x192.png',
    image: data.image,
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    tag: data.tag || Date.now().toString(),
    timestamp: data.timestamp || Date.now()
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'FinanceAnalyst Pro', options).then(() => {
      // Notify clients about push received
      return notifyClients('PUSH_RECEIVED', data);
    })
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event);

  event.notification.close();

  const notificationData = event.notification.data || {};

  // Handle action clicks
  if (event.action) {
    handleNotificationAction(event.action, notificationData);
  } else {
    // Default action - open app
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        const url = notificationData.url || '/';

        // Check if app is already open
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }

        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }

  // Notify clients about notification click
  notifyClients('NOTIFICATION_CLICKED', {
    ...notificationData,
    action: event.action
  });
});

// Notification close event
self.addEventListener('notificationclose', event => {
  console.log('Notification closed:', event);

  // Notify clients about notification close
  notifyClients('NOTIFICATION_CLOSED', event.notification.data || {});
});

// Background sync event
self.addEventListener('sync', event => {
  console.log('Background sync triggered:', event.tag);

  if (event.tag === 'background-sync') {
    event.waitUntil(syncQueuedRequests());
  }
});

// Message event - handle messages from clients
self.addEventListener('message', event => {
  const { type, data } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'GET_VERSION':
      event.ports[0].postMessage({ version: '1.0.0' });
      break;

    case 'CLEAR_CACHE':
      clearAllCaches();
      break;

    case 'UPDATE_CACHE':
      updateCache(data);
      break;

    default:
      console.log('Unknown message type:', type);
  }
});

/**
 * Handle static asset requests
 */
function handleStaticRequest(request) {
  return caches
    .match(request)
    .then(response => {
      if (response) {
        return response;
      }

      // Fetch and cache
      return fetch(request).then(response => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(STATIC_CACHE).then(cache => {
            cache.put(request, responseClone);
          });
        }
        return response;
      });
    })
    .catch(() => {
      // Return offline fallback
      return caches.match('/offline.html');
    });
}

/**
 * Handle API requests
 */
function handleAPIRequest(request) {
  // Network-first strategy for API calls
  return fetch(request)
    .then(response => {
      if (response.ok) {
        // Cache successful responses
        const responseClone = response.clone();
        caches.open(API_CACHE).then(cache => {
          cache.put(request, responseClone);
        });
      }
      return response;
    })
    .catch(() => {
      // Return cached version if available
      return caches.match(request);
    });
}

/**
 * Handle image requests
 */
function handleImageRequest(request) {
  return caches.match(request).then(response => {
    if (response) {
      return response;
    }

    // Fetch and cache
    return fetch(request).then(response => {
      if (response.ok) {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, responseClone);
        });
      }
      return response;
    });
  });
}

/**
 * Handle default requests
 */
function handleDefaultRequest(request) {
  return fetch(request)
    .then(response => {
      // Cache successful HTML responses
      if (response.ok && request.headers.get('accept').includes('text/html')) {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, responseClone);
        });
      }
      return response;
    })
    .catch(() => {
      // Return offline fallback for navigation requests
      if (request.mode === 'navigate') {
        return caches.match('/offline.html');
      }
    });
}

/**
 * Handle notification actions
 */
function handleNotificationAction(action, data) {
  switch (action) {
    case 'view':
      clients.openWindow(data.url || '/');
      break;
    case 'dismiss':
      // Already handled
      break;
    default:
      console.log('Unknown notification action:', action);
  }
}

/**
 * Sync queued requests
 */
async function syncQueuedRequests() {
  try {
    // Get queued requests from IndexedDB
    const requests = await getQueuedRequests();

    for (const request of requests) {
      try {
        await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body
        });

        // Remove from queue
        await removeQueuedRequest(request.id);

        // Notify clients
        notifyClients('SYNC_COMPLETED', { requestId: request.id });
      } catch (error) {
        console.error('Failed to sync request:', error);
        // Keep in queue for retry
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

/**
 * Notify all clients
 */
function notifyClients(type, data) {
  return self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type,
        data,
        timestamp: Date.now()
      });
    });
  });
}

/**
 * Clear all caches
 */
function clearAllCaches() {
  return caches.keys().then(cacheNames => {
    return Promise.all(
      cacheNames.map(cacheName => {
        console.log('Clearing cache:', cacheName);
        return caches.delete(cacheName);
      })
    );
  });
}

/**
 * Update cache with new data
 */
function updateCache(data) {
  return caches.open(API_CACHE).then(cache => {
    const requests = data.map(item => {
      return new Request(item.url, {
        method: 'GET',
        headers: item.headers || {}
      });
    });

    return cache.addAll(requests);
  });
}

/**
 * IndexedDB helpers (simplified)
 */
function getQueuedRequests() {
  // In production, implement IndexedDB operations
  return Promise.resolve([]);
}

function removeQueuedRequest(id) {
  // In production, implement IndexedDB operations
  return Promise.resolve();
}

/**
 * Utility functions
 */
function isStaticAsset(url) {
  const staticExtensions = [
    '.js',
    '.css',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.ico',
    '.woff',
    '.woff2'
  ];
  return staticExtensions.some(ext => url.includes(ext)) || STATIC_ASSETS.includes(url);
}

function isAPIRequest(url) {
  return url.includes('/api/') || API_ENDPOINTS.some(endpoint => url.includes(endpoint));
}

function isImageRequest(url) {
  return /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(url);
}

// Export for module support
if (typeof module !== 'undefined' && module.exports) {
  module.exports = self;
}
