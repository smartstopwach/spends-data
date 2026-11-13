/*
 * Spends Data no longer ships as an installable app or offline app.
 * This file only exists so browsers that installed the old service worker
 * drop it: it clears the old caches and unregisters itself. The page does
 * not register a service worker anymore, so this file can be deleted later.
 */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const windows = await self.clients.matchAll({ type: 'window' });
      windows.forEach((client) => client.navigate(client.url));
    })()
  );
});
