import { useCallback } from "react";
import { useQueryClient, InfiniteData } from "@tanstack/react-query";
import { profileService } from "@/services/profile";
import { FeedResponse, Post, Comment } from "@/types/feed";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";

/**
 * Custom hook to manage follow/unfollow actions with optimistic updates
 * Ensures consistency across all components (feed, profile, posts, avatars)
 */
export function useFollowUser() {
  const queryClient = useQueryClient();

  const followUser = useCallback(
    async (
      userId: string,
      username?: string
    ) => {
      try {
        // Optimistically update all relevant caches
        updateFollowStateInCaches(queryClient, userId, true);

        // Perform the API call
        await profileService.followUser(userId);

        // Only invalidate the specific profile query to update follower count
        // Don't invalidate anything else - we've already updated all caches optimistically
        queryClient.invalidateQueries({ queryKey: queryKeys.profile.byUserId(userId) });

        if (username) {
          toast.success(`You are now following @${username}`);
        }

        return true;
      } catch (error) {
        console.error("Follow error:", error);
        toast.error("Failed to follow user");

        // Revert optimistic update on error
        updateFollowStateInCaches(queryClient, userId, false);

        return false;
      }
    },
    [queryClient]
  );

  const unfollowUser = useCallback(
    async (userId: string, username?: string) => {
      try {
        // Optimistically update all relevant caches
        updateFollowStateInCaches(queryClient, userId, false);

        // Perform the API call
        await profileService.unfollowUser(userId);

        // Only invalidate the specific profile query to update follower count
        // Don't invalidate anything else - we've already updated all caches optimistically
        queryClient.invalidateQueries({ queryKey: queryKeys.profile.byUserId(userId) });

        if (username) {
          toast.success(`You unfollowed @${username}`);
        }

        return true;
      } catch (error) {
        console.error("Unfollow error:", error);
        toast.error("Failed to unfollow user");

        // Revert optimistic update on error
        updateFollowStateInCaches(queryClient, userId, true);

        return false;
      }
    },
    [queryClient]
  );

  const toggleFollow = useCallback(
    async (userId: string, isCurrentlyFollowing: boolean, username?: string) => {
      if (isCurrentlyFollowing) {
        return await unfollowUser(userId, username);
      } else {
        return await followUser(userId, username);
      }
    },
    [followUser, unfollowUser]
  );

  return {
    followUser,
    unfollowUser,
    toggleFollow,
  };
}

/**
 * Helper function to update follow state in all relevant query caches
 */
function updateFollowStateInCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string,
  isFollowing: boolean
) {
  // Update feed cache (infinite query)
  queryClient.setQueriesData<InfiniteData<FeedResponse>>(
    { queryKey: queryKeys.feed.all },
    (oldData) => {
      if (!oldData) return oldData;

      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          data: page.data.map((post: Post) => {
            if (post.user.id === userId) {
              return {
                ...post,
                user: {
                  ...post.user,
                  is_following: isFollowing,
                },
              };
            }
            return post;
          }),
        })),
      };
    }
  );

  // Update user posts cache (all user profile pages)
  queryClient.setQueriesData<{ data: Post[] }>(
    { queryKey: queryKeys.userPosts.all },
    (oldData) => {
      if (!oldData) return oldData;

      return {
        ...oldData,
        data: oldData.data.map((post: Post) => {
          if (post.user.id === userId) {
            return {
              ...post,
              user: {
                ...post.user,
                is_following: isFollowing,
              },
            };
          }
          return post;
        }),
      };
    }
  );

  // Update profile cache
  queryClient.setQueriesData(
    { queryKey: queryKeys.profile.byUserId(userId) },
    (oldData: any) => {
      if (!oldData) return oldData;

      return {
        ...oldData,
        is_following: isFollowing,
        follower_count: isFollowing
          ? (oldData.follower_count || 0) + 1
          : Math.max((oldData.follower_count || 0) - 1, 0),
      };
    }
  );

  // Update individual post detail pages
  // Use predicate to explicitly match all post queries
  queryClient.setQueriesData<Post>(
    {
      predicate: (query) =>
        query.queryKey[0] === "post" &&
        query.queryKey.length === 2 &&
        typeof query.queryKey[1] === "string"
    },
    (oldData) => {
      if (!oldData || oldData.user.id !== userId) return oldData;

      return {
        ...oldData,
        user: {
          ...oldData.user,
          is_following: isFollowing,
        },
      };
    }
  );

  // Update individual comment detail pages
  // Use predicate to explicitly match all comment queries
  queryClient.setQueriesData<Comment>(
    {
      predicate: (query) =>
        query.queryKey[0] === "comment" &&
        query.queryKey.length === 2 &&
        typeof query.queryKey[1] === "string"
    },
    (oldData) => {
      if (!oldData || oldData.user.id !== userId) return oldData;

      return {
        ...oldData,
        user: {
          ...oldData.user,
          is_following: isFollowing,
        },
      };
    }
  );

  // Update comments in post detail pages
  // Use predicate to match all ["comments", postId] queries
  queryClient.setQueriesData<Comment[]>(
    {
      predicate: (query) =>
        query.queryKey[0] === "comments" &&
        query.queryKey.length === 2 &&
        typeof query.queryKey[1] === "string"
    },
    (oldData) => {
      if (!oldData) return oldData;

      return oldData.map((comment) => {
        if (comment.user.id === userId) {
          return {
            ...comment,
            user: {
              ...comment.user,
              is_following: isFollowing,
            },
          };
        }
        return comment;
      });
    }
  );

  // Update comment replies
  // Use predicate to match all ["commentReplies", commentId] queries
  queryClient.setQueriesData<Comment[]>(
    {
      predicate: (query) =>
        query.queryKey[0] === "commentReplies" &&
        query.queryKey.length === 2 &&
        typeof query.queryKey[1] === "string"
    },
    (oldData) => {
      if (!oldData) return oldData;

      return oldData.map((reply) => {
        if (reply.user.id === userId) {
          return {
            ...reply,
            user: {
              ...reply.user,
              is_following: isFollowing,
            },
          };
        }
        return reply;
      });
    }
  );
}
