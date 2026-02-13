"use client";

import { useState, useEffect, useCallback } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { feedService } from "@/services/feed";
import { AppShell } from "@/components/layout";
import { PostCard, CreatePost } from "@/components/feed";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PageContent } from "@/components/ui/page-content";
import { queryKeys } from "@/lib/query-keys";

// const tabs = ["Feed", "Thesis", "Market"] as const;
const tabs = ["Feed"] as const;
type Tab = (typeof tabs)[number];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("Feed");
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: queryKeys.feed.list(),
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
      <PageHeader>
        <nav className="flex gap-6 justify-center">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm font-medium pb-0.5 transition-colors ${
                activeTab === tab
                  ? "text-gray-900 border-b-2 border-gray-900"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </PageHeader>
      
      <PageContent>
        {/* Create Post */}
        <CreatePost />

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
              <PostCard
                key={post.id}
                post={post}
                onUpdate={handlePostUpdate}
                onDelete={() => refetch()}
              />
            ))}
            {isFetchingNextPage && <LoadingSpinner size="md" />}
          </>
        )}
      </PageContent>
    </AppShell>
  );
}
