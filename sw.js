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
// SW_VERSION MUST TRACK package.json. The activate handler only deletes stale
// caches and only posts 'sw-updated' when this string CHANGES, so a version
// left behind means devices are never told a new build shipped. It sat at
// v9.24 while package.json said 10.0.0, which is exactly that failure.
// tools/checkSwVersion.mjs now fails the gate if the two disagree; bump both
// together or the build stops.
const SW_VERSION = 'ltb-v10.2';
// The owner app moved from '/' to '/kitchen.html' so that the site root could
// become the customer door. '/' is now a redirect stub and is deliberately NOT
// precached: caching a redirect makes the offline fallback point at a page that
// only tells you to go somewhere else.
const SHELL = ['/kitchen.html', '/app.js', '/manifest.json'];

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

// ── WEB SHARE TARGET (PC only, and that limitation is the point) ────────────
//
// The manifest registers LTB as a share target so that on Kevin's PC, where the
// PWA is installed, "share to LTB" appears in the OS share menu. This handler
// catches the resulting POST, stashes the payload, and redirects into the app,
// which drains it into the capture inbox on boot.
//
// THIS PATH DOES NOT WORK ON HIS PHONE AND IS NOT SUPPOSED TO. iOS Safari does
// not implement the Web Share Target API, so no amount of manifest correctness
// puts LTB in the iOS share sheet. The phone route is an iOS Shortcut posting
// to the worker's /capture endpoint instead — see SHORTCUT_SETUP.md. Both feed
// the same inbox. Do not delete this as dead code after testing on a phone and
// finding it never fires; it is for the other device.
//
// THE STASH IS A CACHE, NOT localStorage. A shared screenshot is megabytes and
// the whole app lives in about five of localStorage, which order photos already
// strain. It is also the only storage a service worker can write that survives
// the redirect.
const SHARE_STASH = 'ltb-share-stash';

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const reqUrl = new URL(req.url);

  if (req.method === 'POST' && reqUrl.pathname === '/kitchen.html' && reqUrl.searchParams.has('share')) {
    event.respondWith((async () => {
      try {
        const form = await req.formData();
        const files = form.getAll('files').filter(f => f && typeof f.arrayBuffer === 'function');
        const cache = await caches.open(SHARE_STASH);
        const stamp = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        const refs = [];
        for (let i = 0; i < files.length && i < 10; i++) {
          const key = '/__share/' + stamp + '_' + i;
          await cache.put(new Request(key), new Response(files[i], {
            headers: { 'Content-Type': files[i].type || 'application/octet-stream' },
          }));
          refs.push(key);
        }
        await cache.put(new Request('/__share/' + stamp + '.json'), new Response(JSON.stringify({
          id: 'cap_' + stamp,
          source: 'share',
          capturedAt: Date.now(),
          title: form.get('title') || '',
          text: form.get('text') || '',
          url: form.get('url') || '',
          fileRefs: refs,
        }), { headers: { 'Content-Type': 'application/json' } }));
      } catch (e) {
        // A share that fails to stash must still land the user in the app
        // rather than on an error page they cannot act on.
      }
      // 303 so the browser re-issues as GET; a 302 would repeat the POST.
      return Response.redirect('/kitchen.html?shared=1', 303);
    })());
    return;
  }

  if (req.method !== 'GET') return;
  const url = reqUrl;
  if (url.origin !== self.location.origin) return; // never touch the worker API

  event.respondWith(
    fetch(req)
      .then((res) => {
        // NEVER CACHE AN AUTH CHALLENGE AS IF IT WERE THE APP.
        //
        // /kitchen.html and /app.js sit behind Cloudflare Access. When an
        // Access session expires, a request for app.js comes back as
        // Cloudflare's HTML login page with status 200 — which passes res.ok
        // and res.type === 'basic' and would be cached as the JavaScript
        // bundle. From then on the app serves a login page as its own code,
        // offline and online, until someone clears storage by hand. It looks
        // like a totally broken app with no cause.
        //
        // So: a response only gets cached if its content type matches what the
        // request actually asked for.
        const ct = (res && res.headers && res.headers.get('content-type')) || '';
        const wantsScript = /\.m?js(\?|$)/.test(url.pathname);
        const wantsJson = /\.json(\?|$)/.test(url.pathname);
        const looksLikeLogin = /text\/html/i.test(ct) && (wantsScript || wantsJson);
        const cacheable = res && res.ok && res.type === 'basic' && !looksLikeLogin
          && !(wantsScript && !/javascript|ecmascript|text\/plain/i.test(ct));

        if (cacheable) {
          const copy = res.clone();
          caches.open(SW_VERSION).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match('/kitchen.html'))),
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
