// PocketLens service worker.
// Strategy: never cache pages or API responses (they hold per-user, authenticated data).
// Only immutable build assets and icons are cached. When a page navigation fails because
// the device is offline, an inline offline page is shown instead of the browser error.

const CACHE = 'pocketlens-static-v1';

const OFFLINE_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Offline | PocketLens</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
    font-family:system-ui,-apple-system,sans-serif;background:#fff;color:#0f172a;text-align:center;padding:16px}
  .badge{width:64px;height:64px;border-radius:16px;background:#3b82f6;margin:0 auto 20px;
    display:flex;align-items:center;justify-content:center}
  h1{font-size:20px;margin:0 0 8px} p{color:#64748b;margin:0 0 24px}
  button{background:#3b82f6;color:#fff;border:0;border-radius:10px;padding:12px 20px;font-size:15px;font-weight:600}
</style></head>
<body><div>
  <div class="badge"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg></div>
  <h1>You're offline</h1>
  <p>PocketLens needs an internet connection to load your expenses.</p>
  <button onclick="location.reload()">Try again</button>
</div></body></html>`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(['/icons/icon-192.png', '/icons/icon-512.png'])
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Page navigations: always go to the network; fall back to the offline page.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(
        () => new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
      )
    );
    return;
  }

  // Hashed build assets and icons never change for a given URL: cache-first.
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
    );
  }
  // Everything else (API calls, RSC payloads, etc.) goes straight to the network.
});
