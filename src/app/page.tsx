"use client";

import { useEffect, useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { feedService } from "@/services/feed";
import { AppShell } from "@/components/layout";
import { PostCard, CreatePost } from "@/components/feed";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { IconButton } from "@/components/ui/icon-button";
import { ArrowsClockwiseIcon } from "@phosphor-icons/react";

export default function HomePage() {
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await feedService.getFeed(pageParam, 20);
      return response;
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.meta) return undefined;
      if (lastPage.meta.current_page < lastPage.meta.last_page) {
        return lastPage.meta.current_page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  // Derive posts from React Query data
  const posts = data?.pages.flatMap((page) => page.data) ?? [];

  const handlePostCreated = useCallback(() => {
    // Refetch to get the latest posts including the newly created one
    refetch();
  }, [refetch]);

  const handlePostUpdate = useCallback(() => {
    // Refetch to get the updated post
    refetch();
  }, [refetch]);

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
      {/* Header */}
      <PageHeader
        title="Home"
        actions={
          <IconButton onClick={() => refetch()}>
            <ArrowsClockwiseIcon className="h-5 w-5" />
          </IconButton>
        }
      />

      {/* Create Post */}
      <CreatePost onPostCreated={handlePostCreated} />

      {/* Feed */}
      {isLoading ? (
        <LoadingSpinner size="lg" />
      ) : isError ? (
        <EmptyState
          title="Failed to load feed"
          action={
            <button
              onClick={() => refetch()}
              className="rounded-lg bg-[#27CEC5] px-4 py-2 text-sm font-medium text-white hover:bg-[#20b5ad]"
            >
              Try again
            </button>
          }
        />
      ) : posts.length === 0 ? (
        <EmptyState
          title="No posts yet"
          description="Be the first to post something!"
        />
      ) : (
        <>
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onUpdate={handlePostUpdate} />
          ))}
          {isFetchingNextPage && <LoadingSpinner size="md" />}
        </>
      )}
    </AppShell>
  );
}
