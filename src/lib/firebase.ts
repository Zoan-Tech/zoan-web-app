import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getMessaging, getToken, Messaging } from "firebase/messaging";
import { config } from "./config";

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

function getFirebaseApp(): FirebaseApp {
    if (app) return app;

    if (getApps().length > 0) {
        app = getApps()[0];
        return app;
    }

    app = initializeApp({
        apiKey: config.firebase.apiKey,
        authDomain: config.firebase.authDomain,
        projectId: config.firebase.projectId,
        storageBucket: config.firebase.storageBucket,
        messagingSenderId: config.firebase.messagingSenderId,
        appId: config.firebase.appId,
    });

    return app;
}

export function getMessagingInstance(): Messaging | null {
    if (typeof window === "undefined") return null;
    if (messaging) return messaging;

    try {
        const firebaseApp = getFirebaseApp();
        messaging = getMessaging(firebaseApp);
        return messaging;
    } catch (error) {
        console.error("Failed to initialize Firebase Messaging:", error);
        return null;
    }
}

export async function requestNotificationPermission(): Promise<string | null> {
    if (typeof window === "undefined") return null;

    try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
            console.warn("Notification permission denied");
            return null;
        }

        const messagingInstance = getMessagingInstance();
        if (!messagingInstance) return null;

        // Register the service worker
        const registration = await navigator.serviceWorker.register(
            "/firebase-messaging-sw.js"
        );

        const token = await getToken(messagingInstance, {
            vapidKey: config.firebase.vapidKey,
            serviceWorkerRegistration: registration,
        });

        return token;
    } catch (error) {
        console.error("Failed to get FCM token:", error);
        return null;
    }
}
