// Service Worker للتعامل مع الإشعارات وPWA

// تثبيت Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  self.skipWaiting();
});

// تفعيل Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  event.waitUntil(clients.claim());
});

// استقبال الرسائل من التطبيق الرئيسي
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'NOTIFICATION_REQUEST') {
    const { title, body, icon, tag } = event.data.payload;

    self.registration.showNotification(title, {
      body: body,
      icon: icon || '/logo_1.png',
      badge: '/logo_1.png',
      tag: tag || 'molkhas-notification',
      requireInteraction: false,
      silent: false,
      actions: [
        {
          action: 'view',
          title: 'عرض'
        },
        {
          action: 'close',
          title: 'إغلاق'
        }
      ]
    });
  }

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// التعامل مع النقر على الإشعار
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received.');

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // افتح التطبيق أو انتقل لصفحة معينة
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const url = event.action === 'view' ? '/' : '/';

      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// التعامل مع الإشعارات المغلقة
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed.', event);
});

// تسجيل الاشتراك في الإشعارات (للاستخدام المستقبلي مع FCM أو خدمة إشعارات أخرى)
self.addEventListener('push', (event) => {
  console.log('Push message received.');

  if (event.data) {
    const data = event.data.json();

    const options = {
      body: data.body || 'إشعار جديد من Molkhas',
      icon: data.icon || '/logo_1.png',
      badge: '/logo_1.png',
      tag: data.tag || 'molkhas-push',
      requireInteraction: data.requireInteraction || false,
      data: data.data || {},
      actions: [
        {
          action: 'view',
          title: 'عرض'
        },
        {
          action: 'close',
          title: 'إغلاق'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Molkhas', options)
    );
  }
});

// معالجة الخلفية للإشعارات (background sync)
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);

  if (event.tag === 'background-notification') {
    event.waitUntil(sendBackgroundNotification());
  }
});

async function sendBackgroundNotification() {
  try {
    // هنا يمكن إضافة منطق لإرسال إشعارات في الخلفية
    console.log('Background notification sent');
  } catch (error) {
    console.error('Background notification failed:', error);
  }
}
