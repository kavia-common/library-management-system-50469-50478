const CACHE_VERSION = 'v1.0.0';
const APP_SHELL_CACHE = `app-shell-${CACHE_VERSION}`;
const RUNTIME_API_CACHE = `api-cache-${CACHE_VERSION}`;
const IMAGE_CACHE = `img-cache-${CACHE_VERSION}`;
const APP_SHELL = [
  '/', // CRA serves index.html
  '/index.html',
  '/manifest.json',
  '/favicon.ico'
];

// Install: pre-cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

// Activate: cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => ![APP_SHELL_CACHE, RUNTIME_API_CACHE, IMAGE_CACHE].includes(k))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Utility: network-first for API with fallback to cache
async function networkFirstApi(request) {
  try {
    const res = await fetch(request);
    const cache = await caches.open(RUNTIME_API_CACHE);
    cache.put(request, res.clone());
    return res;
  } catch (err) {
    const cache = await caches.open(RUNTIME_API_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    // As a last resort, try the app shell for navigation fallbacks
    const shell = await caches.open(APP_SHELL_CACHE);
    const fallback = await shell.match('/index.html');
    return fallback || new Response(JSON.stringify({ error: 'offline' }), { headers: { 'Content-Type': 'application/json' }, status: 503 });
  }
}

// Utility: cache-first for images with TTL via cache bust check (simple)
async function cacheFirstImage(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    cache.put(request, res.clone());
    return res;
  } catch {
    return cached || Response.error();
  }
}

// App shell navigation fallback (SPA)
function isNavigationRequest(event) {
  return event.request.mode === 'navigate';
}

// Routing
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle navigation requests with SPA fallback
  if (isNavigationRequest(event)) {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(APP_SHELL_CACHE);
        const cached = await cache.match('/index.html');
        return cached;
      })
    );
    return;
  }

  // API caching: network-first for /api paths and related endpoints
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstApi(request));
    return;
  }

  // Image caching
  if (request.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
    event.respondWith(cacheFirstImage(request));
    return;
  }

  // Static assets: cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((res) => {
        // Optionally cache CSS/JS
        if (request.method === 'GET' && (request.destination === 'style' || request.destination === 'script')) {
          caches.open(APP_SHELL_CACHE).then((c) => c.put(request, res.clone()));
        }
        return res;
      }))
    );
  }
});

// Listen to skipWaiting message to activate new SW immediately
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
