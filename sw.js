// LTB service worker.
//
// WHY THIS EXISTS: App.jsx has always called navigator.serviceWorker.register
// ('/sw.js'), but no such file existed, so the registration 404'd and was
// swallowed by the .catch. That left two gaps. First, push notifications need
// a worker to receive them. Second, and the reason this file is written the
// way it is, a PWA with no worker has no way to tell a phone that a new build
// shipped, so a device could keep running an old bundle after a deploy.
//
// STRATEGY: NETWORK-FIRST, always. Cache is a fallback for offline only, never
// a source of truth. Kevin ships several times a week and the app is his
// operations brain; serving him a stale bundle to save a few hundred
// milliseconds would be a bad trade. Do not "optimize" this to cache-first.
//
// Bump SW_VERSION whenever app.js ships. The activate handler deletes every
// cache that does not match, then tells open clients a new version landed.
const SW_VERSION = 'ltb-v9.24';
const SHELL = ['/', '/index.html', '/app.js', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SW_VERSION)
      // Individually, so one missing asset cannot fail the whole install.
      .then(cache => Promise.all(SHELL.map(url => cache.add(url).catch(() => null))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== SW_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then(clients => {
        clients.forEach(c => c.postMessage({ type: 'sw-updated', version: SW_VERSION }));
      }),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // never touch the worker API

  event.respondWith(
    fetch(req)
      .then((res) => {
        // Only shell-ish same-origin GETs are worth keeping for offline.
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(SW_VERSION).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match('/index.html'))),
  );
});

// Push: the reason the registration existed in the first place.
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = {}; }
  const title = data.title || 'LTB';
  const body = data.body || 'New activity';
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/ltb-logo.png',
      badge: '/ltb-logo.png',
      tag: data.tag || 'ltb',
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const c of clients) if ('focus' in c) return c.focus();
      return self.clients.openWindow('/');
    }),
  );
});
