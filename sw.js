/**
 * LTB Service Worker — Push Notifications
 *
 * Handles incoming push events from the Cloudflare Worker and displays
 * a notification on the device. Also does a minimal install/activate
 * cycle so the SW stays current.
 */

const SW_VERSION = 'ltb-sw-v1';

self.addEventListener('install', (event) => {
  // Skip waiting so the new SW activates immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// ── Push handler ─────────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  let data = { title: 'New LTB Order', body: 'A new order just came in.', customer: '' };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text() || data.body;
    }
  }

  const title = data.title || 'New LTB Order';
  const options = {
    body: data.body || 'A new order just came in.',
    icon: '/ltb-icon.png',   // optional — uses whatever icon is in your repo root
    badge: '/ltb-icon.png',
    tag: 'ltb-order',        // replaces previous notification instead of stacking
    renotify: true,          // vibrate/sound even if replacing the same tag
    data: { url: self.location.origin },
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ── Notification click handler ───────────────────────────────────────────────
// Tapping the notification opens (or focuses) the app.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || self.location.origin;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If the app is already open, focus it
      for (const client of clientList) {
        if (client.url.startsWith(target) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(target);
      }
    })
  );
});
