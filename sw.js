// Field Ops Console (admin) - service worker
const CACHE = 'fos-admin-v1';
const FILES = ['./', 'index.html', 'manifest.json', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable.png', 'icons/logo.png', 'icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.allSettled(FILES.map(f => c.add(f))))   // one missing file must not block install
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  // only touch this app's own caches: other apps on the same origin keep theirs
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k.startsWith('fos-admin-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === 'script.google.com' || url.hostname === 'script.googleusercontent.com') return;   // live backend, never cache

  // pages: network first (so a new release shows up), cached copy when offline
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put('index.html', copy)); }
        return res;
      }).catch(() => caches.match('index.html'))
    );
    return;
  }

  // everything else: cached copy first, otherwise fetch and keep it
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok && res.type !== 'opaque' && !/\.csv$/i.test(url.pathname)) {   // big report CSVs are not cached
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match('index.html')))
  );
});
