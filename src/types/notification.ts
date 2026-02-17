export type NotificationType =
    | "like"
    | "comment"
    | "follow"
    | "mention"
    | "repost"
    | "quote"
    | "reply";

export interface NotificationActor {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    is_verified: boolean;
}

export interface NotificationMetadata {
    actor_id?: string;
    post_id?: string;
    post_content?: string;
    comment_id?: string;
    comment_content?: string;
    follower_id?: string;
    original_post_id?: string;
    quote_post_id?: string;
    quote_content?: string;
}

export interface Notification {
    id: string;
    type: NotificationType;
    actor: NotificationActor;
    metadata: NotificationMetadata;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
}

export interface NotificationsResponse {
    success: boolean;
    data: {
        notifications: Notification[];
        next_cursor: string | null;
        has_more: boolean;
    };
}

export interface UnreadCountResponse {
    success: boolean;
    data: {
        unread_count: number;
    };
}

export interface GetNotificationsParams {
    type?: NotificationType;
    is_read?: string;
    limit?: number;
    cursor?: string;
}
