self.addEventListener('install', function (event) {
  self.skipWaiting();
});

self.addEventListener('push', function (event) {
  const data = event.data?.json() ?? {}
  const title = data.title || 'MSWD San Luis Pampanga'
  const options = {
    body: data.body,
    icon: data.icon || '/mswd.png',
    badge: '/mswd.png',
    data: { url: data.url || '/' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Kung may bukas na tab/window ng app — focus na lang
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          return client.navigate(event.notification.data.url)
        }
      }
      // Kung wala — mag-open ng bagong window
      if (clients.openWindow) {
        return clients.openWindow(self.location.origin + event.notification.data.url)
      }
    })
  )
});

// Activate immediately — hindi maghihintay ng refresh
self.addEventListener('activate', function (event) {
  event.waitUntil(clients.claim())
});

// Required by Chrome for PWA installability — without this, install prompt won't fire
self.addEventListener('fetch', function (event) {
  event.respondWith(fetch(event.request))
});
