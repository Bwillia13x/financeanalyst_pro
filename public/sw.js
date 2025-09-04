// Service Worker for FinanceAnalyst Pro
// Implements advanced caching strategies for optimal performance

const CACHE_NAME = 'financeanalyst-pro-v2.0.0';
const STATIC_CACHE_NAME = 'financeanalyst-static-v2.0.0';
const API_CACHE_NAME = 'financeanalyst-api-v2.0.0';

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml'
];

// API endpoints to cache
const API_ENDPOINTS = ['/api/health', '/api/version', '/api/config'];

// Cache strategies
const CACHE_STRATEGIES = {
  // Cache-first for static assets
  STATIC: 'static',
  // Network-first for API calls
  API: 'api',
  // Stale-while-revalidate for dynamic content
  DYNAMIC: 'dynamic'
};

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker');

  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),

      // Cache API responses
      caches.open(API_CACHE_NAME).then(cache => {
        console.log('[SW] Preparing API cache');
        return Promise.resolve();
      }),

      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker');

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (
              cacheName !== CACHE_NAME &&
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== API_CACHE_NAME
            ) {
              console.log('[SW] Deleting old cache:', cacheName);
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

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') return;

  // Skip external domains (except allowed ones)
  if (
    url.origin !== self.location.origin &&
    !url.hostname.includes('yahoo.com') &&
    !url.hostname.includes('alphavantage.co')
  ) {
    return;
  }

  // API requests - Network first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Static assets - Cache first
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // Default - Stale while revalidate
  event.respondWith(handleDynamicRequest(request));
});

// Handle API requests (Network first)
async function handleApiRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(API_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('[SW] Network failed for API request, trying cache');
  }

  // Fallback to cache
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Return offline response for API calls
  return new Response(
    JSON.stringify({
      error: 'Offline',
      message: 'Content not available offline'
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// Handle static assets (Cache first)
async function handleStaticRequest(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    // Fetch from network
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache the response
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('[SW] Network failed for static asset');
  }

  // Return offline fallback
  return caches.match('/offline.html') || new Response('Offline', { status: 503 });
}

// Handle dynamic content (Stale while revalidate)
async function handleDynamicRequest(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    // Update cache in background
    fetch(request)
      .then(networkResponse => {
        if (networkResponse.ok) {
          const cache = caches.open(CACHE_NAME);
          cache.then(cache => cache.put(request, networkResponse));
        }
      })
      .catch(() => {
        // Ignore network errors for background updates
      });

    return cachedResponse;
  }

  // Fetch from network
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache for future requests
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('[SW] Network failed for dynamic content');
  }

  // Return cached version or offline fallback
  return (
    cachedResponse || caches.match('/offline.html') || new Response('Offline', { status: 503 })
  );
}

// Check if request is for a static asset
function isStaticAsset(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Static file extensions
  if (pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
    return true;
  }

  // Specific static routes
  if (
    pathname === '/' ||
    pathname === '/index.html' ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/images/') ||
    pathname.startsWith('/fonts/')
  ) {
    return true;
  }

  return false;
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Handle push notifications
self.addEventListener('push', event => {
  console.log('[SW] Push notification received');

  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(self.registration.showNotification('FinanceAnalyst Pro', options));
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked');

  event.notification.close();

  event.waitUntil(clients.openWindow('/'));
});

// Background sync implementation
async function doBackgroundSync() {
  try {
    // Implement background sync logic here
    console.log('[SW] Performing background sync');

    // Example: Sync pending analytics data
    // const pendingData = await getPendingAnalyticsData();
    // if (pendingData.length > 0) {
    //   await sendAnalyticsData(pendingData);
    // }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Performance monitoring
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'PERFORMANCE_METRIC') {
    console.log('[SW] Performance metric received:', event.data.metric);
    // Store or process performance metrics
  }
});

// Clean up old caches periodically
self.addEventListener('periodicsync', event => {
  if (event.tag === 'cleanup-cache') {
    event.waitUntil(cleanupOldCaches());
  }
});

async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(
    name =>
      name.startsWith('financeanalyst-') &&
      name !== CACHE_NAME &&
      name !== STATIC_CACHE_NAME &&
      name !== API_CACHE_NAME
  );

  return Promise.all(oldCaches.map(cacheName => caches.delete(cacheName)));
}
