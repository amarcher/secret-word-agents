/* Secret Agent Words — service worker.
 *
 * Two responsibilities:
 *   1. Handle 'push' events from the server and surface a system notification.
 *   2. Handle 'notificationclick' to focus an existing tab or open the room URL.
 *
 * No offline shell or asset caching yet — Phase 6 ships push only. Add a
 * Workbox-style cache step later if we want true offline launch.
 */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', event => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Secret Agent Words', body: event.data.text() };
  }

  const title = payload.title || 'Secret Agent Words';
  const options = {
    body: payload.body || '',
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: payload.roomCode ? `saw-${payload.roomCode}` : 'saw',
    renotify: true,
    data: payload,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const data = event.notification.data || {};
  const target = data.roomCode ? `/room/${data.roomCode}` : '/';

  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      // If a tab is already on this room, focus it.
      for (const client of all) {
        const url = new URL(client.url);
        if (url.pathname === target) {
          await client.focus();
          return;
        }
      }
      // Otherwise focus any tab and route it, else open new.
      if (all.length > 0) {
        await all[0].focus();
        all[0].postMessage({ type: 'navigate', target });
        return;
      }
      await self.clients.openWindow(target);
    })(),
  );
});
