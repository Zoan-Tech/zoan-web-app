"use client";

import { useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { feedService } from "@/services/feed";
import { AppShell } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { PageContent } from "@/components/ui/page-content";
import { UserAvatar } from "@/components/ui/user-avatar";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CommentCard, ReplyInput, PostActions } from "@/components/feed";
import { formatRelativeTime } from "@/lib/utils";
import { Post } from "@/types/feed";
import { renderContentWithMentions } from "@/lib/render-mentions";
import {
  DotsThreeIcon,
  CaretLeftIcon,
} from "@phosphor-icons/react";

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  const queryClient = useQueryClient();
  const replyInputRef = useRef<HTMLInputElement>(null);

  const {
    data: post,
    isLoading: isPostLoading,
    isError: isPostError,
  } = useQuery({
    queryKey: ["post", postId],
    queryFn: () => feedService.getPost(postId),
  });

  const {
    data: comments,
    isLoading: isCommentsLoading,
    refetch: refetchComments,
  } = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => feedService.getComments(postId),
    enabled: !!post,
  });

  const handlePostUpdate = (updatedPost: Post) => {
    queryClient.setQueryData(["post", postId], updatedPost);
  };

  if (isPostLoading) {
    return (
      <AppShell>
        <PageHeader title="Post" />
        <PageContent>
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </PageContent>
      </AppShell>
    );
  }

  if (isPostError || !post) {
    return (
      <AppShell>
        <PageHeader title="Post" />
        <PageContent>
          <div className="flex flex-col items-center gap-3 py-12">
            <p className="text-sm text-gray-500">Post not found</p>
            <button
              onClick={() => router.back()}
              className="rounded-lg bg-[#27CEC5] px-4 py-2 text-sm font-medium text-white hover:bg-[#20b5ad]"
            >
              Go back
            </button>
          </div>
        </PageContent>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Header with back button */}
      <PageHeader>
        <div className="flex w-full items-center">
          <button
            onClick={() => router.back()}
            className="absolute left-4 p-1 text-gray-600 hover:text-gray-900"
          >
            <CaretLeftIcon className="h-4 w-4" weight="bold" />
          </button>
          <span className="mx-auto text-sm font-medium text-gray-900">Post</span>
        </div>
      </PageHeader>

      <PageContent>
        {/* Main Post */}
        <article className="border-b border-[#E1F1F0] px-4 py-4">
          <div className="flex gap-3">
            <Link href={`/profile/${post.user.id}`} className="flex-shrink-0">
              <UserAvatar user={post.user} size="md" />
            </Link>

            <div className="min-w-0 flex-1">
              {/* Header */}
              <div className="flex items-start gap-1">
                <Link
                  href={`/profile/${post.user.id}`}
                  className="truncate font-semibold text-gray-900 hover:underline text-sm"
                >
                  {post.user.display_name}
                </Link>
                {post.user.is_verified && <VerifiedBadge size="sm" />}
                <span className="text-gray-500 text-[12px]">
                  @{post.user.username}
                </span>
                <div className="ml-auto flex items-center justify-end">
                  <span className="p-1 text-gray-500 text-[12px]">
                    {formatRelativeTime(post.created_at)}
                  </span>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <DotsThreeIcon className="h-4 w-4" weight="bold" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <p className="mt-1 whitespace-pre-wrap text-gray-900 text-[12px]">
                {renderContentWithMentions(post.content, post.entities?.mentions)}
              </p>

              {/* Actions */}
              <div className="mt-3">
                <PostActions post={post} onUpdate={handlePostUpdate} onCommentClick={() => {
                  replyInputRef.current?.focus();
                  replyInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                }} />
              </div>
            </div>
          </div>
        </article>

        {/* Reply Input */}
        <ReplyInput postId={postId} onReplyCreated={() => refetchComments()} inputRef={replyInputRef} />

        {/* Comments */}
        {isCommentsLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : comments && comments.length > 0 ? (
          comments.map((comment) => (
            <CommentCard key={comment.id} comment={comment} />
          ))
        ) : null}
      </PageContent>
    </AppShell>
  );
}
