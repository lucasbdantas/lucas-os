self.addEventListener("push", (event) => {
  let payload = {
    body: "Voce tem um lembrete no Lucas OS.",
    tag: "lucas-os-reminder",
    title: "Lucas OS",
    url: "/notifications",
  };

  if (event.data) {
    try {
      payload = {
        ...payload,
        ...event.data.json(),
      };
    } catch {
      payload.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || "Lucas OS", {
      badge: "/icons/lucas-os-icon.svg",
      body: payload.body,
      data: {
        url: payload.url || "/notifications",
      },
      icon: "/icons/lucas-os-icon.svg",
      tag: payload.tag || "lucas-os-reminder",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/notifications";
  const url = new URL(targetUrl, self.location.origin).toString();

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(
      (clients) => {
        for (const client of clients) {
          if ("focus" in client && client.url === url) {
            return client.focus();
          }
        }

        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }

        return undefined;
      },
    ),
  );
});
