/* Custom Service Worker Web Push Listener */
self.addEventListener('push', function (event) {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'Dotmond School Portal';
    const options = {
      body: data.body || 'You have a new notification.',
      icon: data.icon || '/images/dotmond-logo-1.png',
      badge: '/images/dotmond-logo-1.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/dashboard',
      },
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error('Error handling Web Push event:', err);
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
