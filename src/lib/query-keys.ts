/**
 * Centralized query key factory for TanStack Query
 *
 * Benefits:
 * - Type-safe query keys
 * - Consistent key structure across the app
 * - Easy to refactor and maintain
 * - Prevents typos and inconsistencies
 */

export const queryKeys = {
  // Feed queries
  feed: {
    all: ["feed"] as const,
    list: () => [...queryKeys.feed.all] as const,
  },

  // User posts queries
  userPosts: {
    all: ["userPosts"] as const,
    byUserId: (userId: string) => [...queryKeys.userPosts.all, userId] as const,
  },

  // Profile queries
  profile: {
    all: ["profile"] as const,
    byUserId: (userId: string | undefined) => [...queryKeys.profile.all, userId] as const,
  },

  // Post queries
  post: {
    all: ["post"] as const,
    byId: (postId: string) => [...queryKeys.post.all, postId] as const,
  },

  // Comment queries
  comment: {
    all: ["comment"] as const,
    byId: (commentId: string) => [...queryKeys.comment.all, commentId] as const,
  },

  // Comments for a post
  comments: {
    all: ["comments"] as const,
    byPostId: (postId: string) => [...queryKeys.comments.all, postId] as const,
  },

  // Comment replies
  commentReplies: {
    all: ["commentReplies"] as const,
    byCommentId: (commentId: string) => [...queryKeys.commentReplies.all, commentId] as const,
  },

  // Notification queries
  notifications: {
    all: ["notifications"] as const,
    list: (type?: string) => [...queryKeys.notifications.all, "list", type] as const,
    unreadCount: () => [...queryKeys.notifications.all, "unreadCount"] as const,
  },
} as const;

/**
 * Type helper to extract query key type
 * Usage: QueryKey<typeof queryKeys.feed.list>
 */
export type QueryKey<T extends (...args: any[]) => readonly unknown[]> = ReturnType<T>;
