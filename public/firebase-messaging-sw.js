/* eslint-disable no-undef */
// Firebase Messaging Service Worker
// NOTE: Update the firebaseConfig below if your Firebase project config changes.
// Service workers cannot access process.env, so these values must be hardcoded.

importScripts(
    "https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js"
);
importScripts(
    "https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
    apiKey: "AIzaSyAqX-7rVGRVVjF3j7zbOu972nj7qwSnxk4",
    authDomain: "zoan-df9a2.firebaseapp.com",
    projectId: "zoan-df9a2",
    storageBucket: "zoan-df9a2.firebasestorage.app",
    messagingSenderId: "103365547475",
    appId: "1:103365547475:web:326a38aedb0f6d52814b26",
    measurementId: "G-0KGS588S8R"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log("[SW] Background message received:", payload);

    const notificationTitle = payload.notification?.title || "New Notification";
    const notificationOptions = {
        body: payload.notification?.body || "",
        icon: "/logo.png",
        badge: "/logo.png",
        data: payload.data,
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    // Focus the app window or open a new one
    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && "focus" in client) {
                    return client.focus();
                }
            }
            return clients.openWindow("/");
        })
    );
});
