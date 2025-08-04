const CACHE_NAME = 'puls-health-tracker-v1';
const RUNTIME_CACHE = 'puls-runtime-v1';
const OFFLINE_URL = '/offline';

// Essential URLs to cache during install
const PRECACHE_URLS = [
  '/',
  '/app',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/offline',
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        await cache.addAll(PRECACHE_URLS);
      } catch (error) {
        console.error('Failed to cache essential resources:', error);
      }
    })(),
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(async (cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            await caches.delete(cacheName);
          }
        }),
      );
    })(),
  );
  self.clients.claim();
});

// Fetch event - handle all network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external URLs
  if (url.origin !== location.origin) {
    return;
  }

  // Handle different types of requests
  if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request));
  } else if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isApiRequest(request)) {
    event.respondWith(handleApiRequest(request));
  } else {
    event.respondWith(handleOtherRequest(request));
  }
});

// Check if request is a navigation request
function isNavigationRequest(request) {
  return (
    request.mode === 'navigate' ||
    (request.method === 'GET' &&
      request.headers.get('accept').includes('text/html'))
  );
}

// Check if request is for a static asset
function isStaticAsset(request) {
  const url = new URL(request.url);
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/static/') ||
    url.pathname.match(
      /\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$/,
    )
  );
}

// Check if request is for an API endpoint
function isApiRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/');
}

// Handle navigation requests (page routes)
async function handleNavigationRequest(request) {
  try {
    const preloadResponse = await event.preloadResponse;
    if (preloadResponse) {
      return preloadResponse;
    }

    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('Navigation request failed:', error);

    // Try to serve from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fallback to offline page for HTML requests
    const url = new URL(request.url);
    if (url.pathname !== '/offline') {
      return caches.match('/offline');
    }

    // If offline page also fails, return a basic offline response
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Offline - Puls Health Tracker</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
                   text-align: center; padding: 2rem; background: #f8fafc; }
            .container { max-width: 400px; margin: 0 auto; }
            .icon { font-size: 4rem; margin-bottom: 1rem; }
            h1 { color: #1e293b; margin-bottom: 1rem; }
            p { color: #64748b; margin-bottom: 2rem; }
            .button { background: #3b82f6; color: white; padding: 0.75rem 1.5rem; 
                      border: none; border-radius: 0.5rem; cursor: pointer; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">📱</div>
            <h1>You're Offline</h1>
            <p>Please check your internet connection and try again.</p>
            <button class="button" onclick="window.location.reload()">Retry</button>
          </div>
        </body>
      </html>`,
      {
        headers: { 'Content-Type': 'text/html' },
        status: 200,
      },
    );
  }
}

// Handle static asset requests
async function handleStaticAsset(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('Static asset request failed:', error);

    // Return cached version if available
    const fallbackResponse = await cache.match(request);
    if (fallbackResponse) {
      return fallbackResponse;
    }

    // For critical CSS/JS, return a minimal response
    if (request.url.includes('.css')) {
      return new Response('/* Offline - styles not available */', {
        headers: { 'Content-Type': 'text/css' },
      });
    }

    throw error;
  }
}

// Handle API requests
async function handleApiRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    console.error('API request failed:', error);

    // Return a generic offline response for API requests
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'This feature requires an internet connection',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 503,
      },
    );
  }
}

// Handle other requests with network-first strategy
async function handleOtherRequest(request) {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('Other request failed:', error);

    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
}

// Message handling for cache updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
