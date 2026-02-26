"use client";

import { useQuery } from "@tanstack/react-query";
import { notificationService } from "@/services/notification";
import { queryKeys } from "@/lib/query-keys";
import { useAuthStore } from "@/stores/auth";

/**
 * Returns the number of unread notifications for the current user.
 * Keeps data fresh by refetching whenever FCM invalidates the notifications
 * query key (which happens automatically on every incoming message).
 */
export function useNotificationBadge() {
    const { status } = useAuthStore();

    const { data: unreadCount = 0 } = useQuery({
        queryKey: queryKeys.notifications.unreadCount(),
        queryFn: () => notificationService.getUnreadCount(),
        // Only fetch when the user is logged in
        enabled: status === "authenticated",
        // Refetch in the background every 60 s as a safety net
        refetchInterval: 60_000,
        // Don't refetch on window focus – the FCM invalidation handles freshness
        refetchOnWindowFocus: false,
    });

    return { unreadCount };
}
