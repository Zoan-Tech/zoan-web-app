"use client";

import { useRouter } from "next/navigation";
import { Notification, NotificationType } from "@/types/notification";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatRelativeTime } from "@/lib/utils";
import {
    Heart,
    ChatCircle,
    UserPlus,
    At,
    Repeat,
    Quotes,
} from "@phosphor-icons/react";

function getNotificationIcon(type: NotificationType) {
    switch (type) {
        case "like":
            return <Heart weight="fill" className="h-4 w-4 text-red-500" />;
        case "comment":
        case "reply":
            return <ChatCircle weight="fill" className="h-4 w-4 text-blue-500" />;
        case "follow":
            return <UserPlus weight="fill" className="h-4 w-4 text-[#27CEC5]" />;
        case "mention":
            return <At weight="bold" className="h-4 w-4 text-purple-500" />;
        case "repost":
            return <Repeat weight="bold" className="h-4 w-4 text-green-500" />;
        case "quote":
            return <Quotes weight="fill" className="h-4 w-4 text-orange-500" />;
        default:
            return null;
    }
}

function getActionText(type: NotificationType): string {
    switch (type) {
        case "like":
            return "liked your post";
        case "comment":
            return "commented on your post";
        case "reply":
            return "replied to your comment";
        case "follow":
            return "started following you";
        case "mention":
            return "mentioned you in a post";
        case "repost":
            return "reposted your post";
        case "quote":
            return "quoted your post";
        default:
            return "interacted with you";
    }
}

function getContentPreview(notification: Notification): string | null {
    const { type, metadata } = notification;
    switch (type) {
        case "like":
        case "mention":
        case "repost":
            return metadata.post_content || null;
        case "comment":
        case "reply":
            return metadata.comment_content || null;
        case "quote":
            return metadata.quote_content || null;
        default:
            return null;
    }
}

function getNotificationLink(notification: Notification): string {
    const { type, metadata } = notification;
    switch (type) {
        case "like":
        case "mention":
        case "repost":
            return metadata.post_id ? `/post/${metadata.post_id}` : "/";
        case "comment":
        case "reply":
            return metadata.comment_id && metadata.post_id
                ? `/post/${metadata.post_id}/comment/${metadata.comment_id}`
                : metadata.post_id
                    ? `/post/${metadata.post_id}`
                    : "/";
        case "follow":
            return `/profile/${notification.actor.id}`;
        case "quote":
            return metadata.quote_post_id
                ? `/post/${metadata.quote_post_id}`
                : "/";
        default:
            return "/";
    }
}

interface NotificationItemProps {
    notification: Notification;
    onMarkAsRead: (id: string) => void;
}

export function NotificationItem({
    notification,
    onMarkAsRead,
}: NotificationItemProps) {
    const router = useRouter();
    const contentPreview = getContentPreview(notification);

    const handleClick = () => {
        if (!notification.is_read) {
            onMarkAsRead(notification.id);
        }
        router.push(getNotificationLink(notification));
    };

    return (
        <button
            onClick={handleClick}
            className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${!notification.is_read ? "bg-[#E0FAF8]/30" : ""
                }`}
        >
            {/* Avatar with type icon overlay */}
            <div className="relative shrink-0">
                <UserAvatar user={notification.actor} size="sm" />
                <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm">
                    {getNotificationIcon(notification.type)}
                </div>
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug">
                    <span className="font-semibold text-gray-900">
                        {notification.actor.display_name || notification.actor.username}
                    </span>{" "}
                    <span className="text-gray-600">{getActionText(notification.type)}</span>
                </p>

                {contentPreview && (
                    <p className="mt-0.5 truncate text-sm text-gray-400">
                        {contentPreview}
                    </p>
                )}

                <p className="mt-1 text-xs text-gray-400">
                    {formatRelativeTime(notification.created_at)}
                </p>
            </div>

            {/* Unread dot */}
            {!notification.is_read && (
                <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#27CEC5]" />
            )}
        </button>
    );
}
