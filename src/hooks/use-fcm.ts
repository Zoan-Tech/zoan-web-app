"use client";

import { useEffect, useRef } from "react";
import { onMessage } from "firebase/messaging";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import { api, getDeviceId } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import {
    getMessagingInstance,
    requestNotificationPermission,
} from "@/lib/firebase";

export function useFcm() {
    const { status } = useAuthStore();
    const queryClient = useQueryClient();
    const initialized = useRef(false);

    useEffect(() => {
        if (status !== "authenticated") return;
        if (initialized.current) return;

        async function setup() {
            try {
                const token = await requestNotificationPermission();
                if (!token) {
                    console.warn("[FCM] No token received");
                    return;
                }

                initialized.current = true;

                // Register token with backend
                try {
                    await api.post("/auth/device-token", {
                        device_token: token,
                        device_type: "web",
                        device_id: getDeviceId(),
                    });
                } catch (err) {
                    console.error("[FCM] Failed to register token:", err);
                }

                // Listen for foreground messages
                const messaging = getMessagingInstance();
                if (messaging) {
                    onMessage(messaging, (payload) => {

                        const title =
                            payload.notification?.title ||
                            payload.data?.title ||
                            "New Notification";
                        const body =
                            payload.notification?.body ||
                            payload.data?.body ||
                            "";

                        toast(title, {
                            description: body,
                            position: "bottom-right",
                            duration: 6000,
                            id: `fcm-${Date.now()}`,
                            icon: "🔔",
                            style: {
                                background: "#ffffff",
                                border: "1px solid #e5e7eb",
                                color: "#171717",
                                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                            },
                            descriptionClassName: "!text-gray-500",
                        });

                        // Refetch notifications list and unread count
                        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
                    });
                }
            } catch (error) {
                console.error("[FCM] Setup failed:", error);
            }
        }

        setup();
    }, [status]);
}
