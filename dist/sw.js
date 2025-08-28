// Service Worker for FinanceAnalyst Pro
// Optimized for financial application with security considerations

const CACHE_NAME = 'financeanalyst-pro-v1.0.0';
const STATIC_CACHE = 'static-v1.0.0';
const DYNAMIC_CACHE = 'dynamic-v1.0.0';

// Static assets that can be safely cached
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/assets/images/favicon.svg',
  '/assets/images/apple-touch-icon.svg',
  '/assets/images/og-image.svg'
];

// Routes that should work offline (non-sensitive pages)
const OFFLINE_ROUTES = [
  '/',
  '/valuation-tool',
  '/valuation-tool/docs',
  '/financial-inputs-demo'
];

// Sensitive routes that should NEVER be cached
const SENSITIVE_ROUTES = [
  '/private-analysis',
  '/real-time-market-data-center',
  '/api/',
  '/auth/'
];

// Network-first strategy for API calls and sensitive data
const NETWORK_FIRST_PATTERNS = [
  /\/api\//,
  /\/auth\//,
  /market-data/,
  /private-analysis/,
  /\.json$/
];

// Cache-first strategy for static assets
const CACHE_FIRST_PATTERNS = [
  /\.(?:js|css|woff2?|png|jpg|jpeg|svg|gif|ico)$/,
  /\/assets\//
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== CACHE_NAME) {
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
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests except for fonts and images
  if (url.origin !== location.origin && !isSafeExternalResource(url)) {
    return;
  }

  // Never cache sensitive routes
  if (SENSITIVE_ROUTES.some(route => url.pathname.startsWith(route))) {
    console.log('[SW] Bypassing cache for sensitive route:', url.pathname);
    return;
  }

  event.respondWith(handleRequest(request));
});

// Handle different types of requests with appropriate strategies
async function handleRequest(request) {
  const url = new URL(request.url);

  try {
    // Special handling for financial API calls
    if (url.pathname.startsWith('/api/')) {
      return await handleFinancialApiRequest(request);
    }

    // Network-first for API calls and dynamic data
    if (NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname))) {
      return await networkFirst(request);
    }

    // Cache-first for static assets
    if (CACHE_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname))) {
      return await cacheFirst(request);
    }

    // Stale-while-revalidate for HTML pages
    return await staleWhileRevalidate(request);

  } catch (error) {
    console.error('[SW] Request failed:', error);

    // Return offline fallback for navigation requests
    if (request.destination === 'document') {
      return await getOfflineFallback(url.pathname);
    }

    throw error;
  }
}

// Special handler for financial API requests with cache coordination
async function handleFinancialApiRequest(request) {
  const url = new URL(request.url);
  const cacheKey = `api-${url.pathname}${url.search}`;

  // Check if this is sensitive data that shouldn't be cached
  if (isSensitiveFinancialData(url.pathname)) {
    console.log('[SW] Bypassing cache for sensitive financial data:', url.pathname);
    return await fetch(request);
  }

  // For market data, use short TTL cache
  if (url.pathname.includes('/market/') || url.pathname.includes('/quote/')) {
    return await handleMarketDataRequest(request, cacheKey);
  }

  // For reference data, use long TTL cache
  if (url.pathname.includes('/reference/') || url.pathname.includes('/symbols/')) {
    return await handleReferenceDataRequest(request, cacheKey);
  }

  // Default API handling
  return await networkFirst(request);
}

// Handle market data with short TTL and stale-while-revalidate
async function handleMarketDataRequest(request, cacheKey) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);

  // Check cache timestamp
  if (cachedResponse) {
    const cacheTime = cachedResponse.headers.get('sw-cache-time');
    const age = Date.now() - parseInt(cacheTime || '0');

    // If less than 30 seconds old, return cached
    if (age < 30000) {
      console.log('[SW] Serving fresh market data from cache');
      return cachedResponse;
    }

    // If less than 2 minutes old, return stale but refresh in background
    if (age < 120000) {
      console.log('[SW] Serving stale market data, refreshing in background');

      // Refresh in background
      fetch(request).then(async (response) => {
        if (response.ok) {
          const responseToCache = response.clone();
          responseToCache.headers.set('sw-cache-time', Date.now().toString());
          await cache.put(request, responseToCache);
        }
      }).catch(error => {
        console.warn('[SW] Background market data refresh failed:', error);
      });

      return cachedResponse;
    }
  }

  // Fetch fresh data
  try {
    const response = await fetch(request);
    if (response.ok) {
      const responseToCache = response.clone();
      responseToCache.headers.set('sw-cache-time', Date.now().toString());
      await cache.put(request, responseToCache);
    }
    return response;
  } catch (error) {
    // Return stale data if available
    if (cachedResponse) {
      console.log('[SW] Network failed, serving stale market data');
      return cachedResponse;
    }
    throw error;
  }
}

// Handle reference data with long TTL
async function handleReferenceDataRequest(request, cacheKey) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    const cacheTime = cachedResponse.headers.get('sw-cache-time');
    const age = Date.now() - parseInt(cacheTime || '0');

    // Reference data is valid for 24 hours
    if (age < 24 * 60 * 60 * 1000) {
      console.log('[SW] Serving reference data from cache');
      return cachedResponse;
    }
  }

  // Fetch fresh reference data
  try {
    const response = await fetch(request);
    if (response.ok) {
      const responseToCache = response.clone();
      responseToCache.headers.set('sw-cache-time', Date.now().toString());
      await cache.put(request, responseToCache);
    }
    return response;
  } catch (error) {
    if (cachedResponse) {
      console.log('[SW] Network failed, serving stale reference data');
      return cachedResponse;
    }
    throw error;
  }
}

// Check if financial data is sensitive
function isSensitiveFinancialData(pathname) {
  const sensitivePatterns = [
    '/api/user/',
    '/api/private/',
    '/api/portfolio/',
    '/api/models/',
    '/api/analysis/',
    '/api/auth/'
  ];

  return sensitivePatterns.some(pattern => pathname.includes(pattern));
}

// Network-first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    // Only cache successful responses for non-sensitive data
    if (networkResponse.ok && !isSensitiveData(request.url)) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving from cache (network failed):', request.url);
      return cachedResponse;
    }
    throw error;
  }
}

// Cache-first strategy
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    console.log('[SW] Serving from cache:', request.url);
    return cachedResponse;
  }

  const networkResponse = await fetch(request);

  if (networkResponse.ok) {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, networkResponse.clone());
  }

  return networkResponse;
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);

  const networkResponsePromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse.ok && !isSensitiveData(request.url)) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(error => {
    console.log('[SW] Network request failed:', error);
    return null;
  });

  // Return cached version immediately if available
  if (cachedResponse) {
    console.log('[SW] Serving from cache (stale-while-revalidate):', request.url);
    // Update cache in background
    networkResponsePromise;
    return cachedResponse;
  }

  // Wait for network if no cache available
  return await networkResponsePromise || await getOfflineFallback(request.url);
}

// Get offline fallback page
async function getOfflineFallback(pathname) {
  // For supported offline routes, return cached version
  if (OFFLINE_ROUTES.includes(pathname)) {
    const cachedResponse = await caches.match('/');
    if (cachedResponse) {
      return cachedResponse;
    }
  }

  // Return a simple offline page
  return new Response(
    `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Offline - FinanceAnalyst Pro</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: system-ui, sans-serif; text-align: center; padding: 2rem; color: #1e293b; }
        .offline-container { max-width: 400px; margin: 0 auto; }
        .icon { font-size: 4rem; margin-bottom: 1rem; }
        h1 { color: #3b82f6; margin-bottom: 1rem; }
        p { margin-bottom: 1.5rem; color: #64748b; }
        button { background: #3b82f6; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; }
        button:hover { background: #2563eb; }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <div class="icon">📊</div>
        <h1>You're Offline</h1>
        <p>This page requires an internet connection. Please check your network and try again.</p>
        <button onclick="window.location.reload()">Try Again</button>
      </div>
    </body>
    </html>
    `,
    {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache'
      },
      status: 200
    }
  );
}

// Check if URL contains sensitive financial data
function isSensitiveData(url) {
  const sensitiveKeywords = [
    'portfolio', 'account', 'balance', 'transaction', 'price', 'quote',
    'market-data', 'private', 'personal', 'auth', 'login', 'api'
  ];

  return sensitiveKeywords.some(keyword =>
    url.toLowerCase().includes(keyword)
  );
}

// Check if external resource is safe to cache
function isSafeExternalResource(url) {
  const safeDomains = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'cdn.jsdelivr.net'
  ];

  const safeExtensions = ['.woff', '.woff2', '.ttf', '.otf'];

  return safeDomains.some(domain => url.hostname.includes(domain)) ||
         safeExtensions.some(ext => url.pathname.endsWith(ext));
}

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Implement background sync logic here
  // For financial app, this might sync offline actions when online
  console.log('[SW] Performing background sync...');
}

// Push notification handling (if needed for market alerts)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();

  // Only show notifications for important financial alerts
  if (data.type === 'market-alert' || data.type === 'portfolio-update') {
    const options = {
      body: data.message,
      icon: '/assets/images/favicon.svg',
      badge: '/assets/images/favicon.svg',
      tag: data.type,
      requireInteraction: data.urgent || false,
      data: data
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data;
  if (data && data.url) {
    event.waitUntil(
      clients.openWindow(data.url)
    );
  }
});

console.log('[SW] Service worker loaded successfully');