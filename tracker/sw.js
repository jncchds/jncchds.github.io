// App shell cache (the data cache lives in localStorage, see Index.html). API calls go to script.google.com (cross-origin) and are never cached.
const CACHE = 'tracker-20261026125130';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Cache first, refresh in the background: the app opens instantly even on a bad connection,
// and a new version shows up on the next launch.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(e.request, { ignoreSearch: true });
    const refresh = fetch(e.request)
      .then(res => { if (res.ok) cache.put(e.request, res.clone()); return res; })
      .catch(() => null);
    if (cached) { e.waitUntil(refresh); return cached; }
    return (await refresh) || (await cache.match('./index.html')) || Response.error();
  }));
});
