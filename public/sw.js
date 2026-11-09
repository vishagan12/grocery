// Sri Amman Supermarket Service Worker
// Version-controlled PWA caching with offline fallback

const CACHE_VERSION = 'sas-v1.0.1';
const STATIC_CACHE = `sas-static-${CACHE_VERSION}`;
const PAGES_CACHE = `sas-pages-${CACHE_VERSION}`;

const PRECACHE_ASSETS = [
  '/offline.html',
  '/manifest.json',
  '/icon.svg',
];

// Routes that MUST NEVER be cached
const NEVER_CACHE_PATTERNS = [
  /\/api\/auth/,
  /\/api\/orders/,
  /\/api\/admin/,
  /\/api\/rider/,
  /\/api\/webhooks/,
  /\/api\/health/,
  /\/auth\/callback/,
  /supabase\.co/,
  /accounts\.google\.com/,
  /challenges\.cloudflare\.com/,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== STATIC_CACHE && key !== PAGES_CACHE) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Never intercept non-GET requests (mutations, orders, payments)
  if (req.method !== 'GET') {
    return;
  }

  // 2. Ignore browser extension requests or non-http protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // 3. Strictly exclude security, auth, payment, user, and dynamic API endpoints
  if (NEVER_CACHE_PATTERNS.some((pattern) => pattern.test(url.pathname) || pattern.test(url.hostname))) {
    return;
  }

  // 4. HTML Navigation requests (pages): Network-first with offline.html fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(PAGES_CACHE).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          const fallback = await caches.match('/offline.html');
          return fallback || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
        })
    );
    return;
  }

  // 5. Next.js static bundles and public assets: Stale-While-Revalidate
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname === '/icon.svg' ||
    url.pathname === '/manifest.json' ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const fetchPromise = fetch(req)
          .then((networkRes) => {
            if (networkRes.status === 200) {
              cache.put(req, networkRes.clone());
            }
            return networkRes;
          })
          .catch(() => cached);

        return cached || fetchPromise;
      })
    );
  }
});

