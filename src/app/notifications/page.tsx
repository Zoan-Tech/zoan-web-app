"use client";

import { useEffect, useCallback } from "react";
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/services/notification";
import { AppShell } from "@/components/layout";
import { NotificationItem } from "@/components/notification/notification-item";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageContent } from "@/components/ui/page-content";
import { queryKeys } from "@/lib/query-keys";
import { CheckCircle } from "@phosphor-icons/react";

export default function NotificationsPage() {
    const queryClient = useQueryClient();

    // Notifications list with cursor-based pagination
    const {
        data,
        isLoading,
        isError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
    } = useInfiniteQuery({
        queryKey: queryKeys.notifications.list(),
        queryFn: async ({ pageParam }) => {
            return notificationService.getNotifications({
                limit: 20,
                cursor: pageParam as string | undefined,
            });
        },
        getNextPageParam: (lastPage) => {
            if (lastPage.has_more && lastPage.next_cursor) {
                return lastPage.next_cursor;
            }
            return undefined;
        },
        initialPageParam: undefined as string | undefined,
    });

    // Unread count
    const { data: unreadCount } = useQuery({
        queryKey: queryKeys.notifications.unreadCount(),
        queryFn: () => notificationService.getUnreadCount(),
    });

    // Mark single as read
    const markAsReadMutation = useMutation({
        mutationFn: (id: string) => notificationService.markAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
        },
    });

    // Mark all as read
    const markAllAsReadMutation = useMutation({
        mutationFn: () => notificationService.markAllAsRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
        },
    });

    const handleMarkAsRead = useCallback(
        (id: string) => {
            markAsReadMutation.mutate(id);
        },
        [markAsReadMutation]
    );

    const notifications =
        data?.pages.flatMap((page) => page.notifications) ?? [];

    // Infinite scroll
    useEffect(() => {
        const handleScroll = () => {
            if (
                window.innerHeight + window.scrollY >=
                document.body.offsetHeight - 500 &&
                hasNextPage &&
                !isFetchingNextPage
            ) {
                fetchNextPage();
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    return (
        <AppShell>
            <PageHeader
                title="Notifications"
                actions={
                    unreadCount && unreadCount > 0 ? (
                        <button
                            onClick={() => markAllAsReadMutation.mutate()}
                            disabled={markAllAsReadMutation.isPending}
                            className="flex items-center gap-1 text-xs font-medium text-[#27CEC5] hover:text-[#20b5ad] disabled:opacity-50"
                        >
                            <CheckCircle weight="bold" className="h-4 w-4" />
                            Read all
                        </button>
                    ) : null
                }
            />

            <PageContent>
                {/* Notifications list */}
                {isLoading ? (
                    <LoadingSpinner size="lg" />
                ) : isError ? (
                    <EmptyState
                        title="Failed to load notifications"
                        action={
                            <button
                                onClick={() => refetch()}
                                className="rounded-lg bg-[#27CEC5] px-4 py-2 text-sm font-medium text-white hover:bg-[#20b5ad]"
                            >
                                Try again
                            </button>
                        }
                    />
                ) : notifications.length === 0 ? (
                    <EmptyState
                        title="No notifications yet"
                        description="You're all caught up!"
                    />
                ) : (
                    <div className="divide-y divide-gray-100">
                        {notifications.map((notification) => (
                            <NotificationItem
                                key={notification.id}
                                notification={notification}
                                onMarkAsRead={handleMarkAsRead}
                            />
                        ))}
                        {isFetchingNextPage && <LoadingSpinner size="md" />}
                    </div>
                )}
            </PageContent>
        </AppShell>
    );
}
