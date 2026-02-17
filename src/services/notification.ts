import { api } from "@/lib/api";
import {
    NotificationsResponse,
    UnreadCountResponse,
    GetNotificationsParams,
} from "@/types/notification";

export const notificationService = {
    async getNotifications(
        params: GetNotificationsParams = {}
    ): Promise<NotificationsResponse["data"]> {
        const query: Record<string, string | number> = {};
        if (params.type) query.type = params.type;
        if (params.is_read) query.is_read = params.is_read;
        if (params.limit) query.limit = params.limit;
        if (params.cursor) query.cursor = params.cursor;

        const response = await api.get("/notifications", { params: query });
        return response.data.data;
    },

    async getUnreadCount(): Promise<number> {
        const response = await api.get("/notifications/unread-count");
        return (response.data as UnreadCountResponse).data.unread_count;
    },

    async markAsRead(id: string): Promise<void> {
        await api.put(`/notifications/${id}/read`);
    },

    async markAllAsRead(): Promise<void> {
        await api.put("/notifications/read-all");
    },
};
