"use client";

import { useState } from "react";
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
import { useAuthStore } from "@/stores/auth";
import { formatRelativeTime, formatNumber, cn } from "@/lib/utils";
import { Post, Comment } from "@/types/feed";
import { renderContentWithMentions } from "@/lib/render-mentions";
import { toast } from "sonner";
import {
  HeartIcon,
  ChatTeardropIcon,
  RepeatIcon,
  DotsThreeIcon,
  CaretLeftIcon,
  RobotIcon,
  ArrowSquareOutIcon,
} from "@phosphor-icons/react";

function PostActions({
  post,
  onUpdate,
}: {
  post: Post;
  onUpdate: (post: Post) => void;
}) {
  const [isLiking, setIsLiking] = useState(false);
  const [isReposting, setIsReposting] = useState(false);
  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      if (post.is_liked) {
        await feedService.unlikePost(post.id);
        onUpdate({ ...post, is_liked: false, like_count: post.like_count - 1 });
      } else {
        await feedService.likePost(post.id);
        onUpdate({ ...post, is_liked: true, like_count: post.like_count + 1 });
      }
    } catch {
      toast.error("Failed to update like");
    } finally {
      setIsLiking(false);
    }
  };

  const handleRepost = async () => {
    if (isReposting) return;
    setIsReposting(true);
    try {
      if (post.is_reposted) {
        await feedService.unrepost(post.id);
        onUpdate({
          ...post,
          is_reposted: false,
          repost_count: post.repost_count - 1,
        });
      } else {
        await feedService.repost(post.id);
        onUpdate({
          ...post,
          is_reposted: true,
          repost_count: post.repost_count + 1,
        });
      }
    } catch {
      toast.error("Failed to update repost");
    } finally {
      setIsReposting(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  return (
    <div className="flex items-center gap-6">
      <button className="flex w-10 items-center gap-1 text-sm text-gray-500 transition-colors hover:text-[#27CEC5]">
        <ChatTeardropIcon className="h-4 w-4" />
        <span className="min-w-[1ch]">
          {post.reply_count > 0 ? formatNumber(post.reply_count) : ""}
        </span>
      </button>

      <button
        onClick={handleRepost}
        className={cn(
          "flex w-10 items-center gap-1 text-sm transition-colors",
          post.is_reposted
            ? "text-green-500"
            : "text-gray-500 hover:text-green-500"
        )}
      >
        <RepeatIcon className="h-4 w-4" />
        <span className="min-w-[1ch]">
          {post.repost_count > 0 ? formatNumber(post.repost_count) : ""}
        </span>
      </button>

      <button
        onClick={handleLike}
        className={cn(
          "flex w-10 items-center gap-1 text-sm transition-colors",
          post.is_liked ? "text-red-500" : "text-gray-500 hover:text-red-500"
        )}
      >
        <HeartIcon
          className="h-4 w-4"
          weight={post.is_liked ? "fill" : "regular"}
        />
        <span className="min-w-[1ch]">
          {post.like_count > 0 ? formatNumber(post.like_count) : ""}
        </span>
      </button>

      <button
        onClick={handleShare}
        className="text-sm text-gray-500 transition-colors hover:text-[#27CEC5]"
      >
        <ArrowSquareOutIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

function CommentCard({ comment }: { comment: Comment }) {
  const [isLiking, setIsLiking] = useState(false);
  const [liked, setLiked] = useState(comment.is_liked);
  const [likeCount, setLikeCount] = useState(comment.like_count);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      if (liked) {
        await feedService.unlikeComment(comment.id);
        setLiked(false);
        setLikeCount((c) => c - 1);
      } else {
        await feedService.likeComment(comment.id);
        setLiked(true);
        setLikeCount((c) => c + 1);
      }
    } catch {
      toast.error("Failed to update like");
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <article className="border-b border-[#E1F1F0] px-4 py-4">
      <div className="flex gap-3">
        <Link href={`/profile/${comment.user.id}`} className="flex-shrink-0">
          <UserAvatar user={comment.user} size="md" />
        </Link>

        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="flex items-center gap-1">
            <Link
              href={`/profile/${comment.user.id}`}
              className="truncate font-semibold text-gray-900 hover:underline text-sm"
            >
              {comment.user.display_name}
            </Link>
            {comment.user.is_verified && <VerifiedBadge size="sm" />}
            <span className="text-gray-500 text-[12px]">
              @{comment.user.username}
            </span>
            <div className="ml-auto flex items-center justify-end">
              <span className="p-1 text-gray-500 text-[12px]">
                {formatRelativeTime(comment.created_at)}
              </span>
              <button className="p-1 text-gray-400 hover:text-gray-600">
                <DotsThreeIcon className="h-4 w-4" weight="bold" />
              </button>
            </div>
          </div>

          {/* Automated tag */}
          {comment.user.is_agent && <div className="mt-0.5 flex items-center gap-1 text-[11px] text-gray-400">
            <RobotIcon className="h-3.5 w-3.5" />
            <span>
              Automated by{" "}
              <span className="text-[#27CEC5]">@zoan</span>
            </span>
          </div>}

          {/* Content */}
          <p className="mt-1.5 whitespace-pre-wrap text-gray-900 text-[12px]">
            {renderContentWithMentions(comment.content, comment.mentions)}
          </p>

          {/* Actions */}
          <div className="mt-3 flex items-center gap-6">
            <button className="flex w-10 items-center gap-1 text-sm text-gray-500 transition-colors hover:text-[#27CEC5]">
              <ChatTeardropIcon className="h-4 w-4" />
              <span className="min-w-[1ch]">
                {comment.reply_count > 0 ? formatNumber(comment.reply_count) : ""}
              </span>
            </button>

            <button className="flex w-10 items-center gap-1 text-sm text-gray-500 transition-colors hover:text-green-500">
              <RepeatIcon className="h-4 w-4" />
              <span className="min-w-[1ch]" />
            </button>

            <button
              onClick={handleLike}
              className={cn(
                "flex w-10 items-center gap-1 text-sm transition-colors",
                liked ? "text-red-500" : "text-gray-500 hover:text-red-500"
              )}
            >
              <HeartIcon
                className="h-4 w-4"
                weight={liked ? "fill" : "regular"}
              />
              <span className="min-w-[1ch]">
                {likeCount > 0 ? formatNumber(likeCount) : ""}
              </span>
            </button>

            <button className="text-sm text-gray-500 transition-colors hover:text-[#27CEC5]">
              <ArrowSquareOutIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function ReplyInput({ postId, onCommentCreated }: { postId: string; onCommentCreated: () => void }) {
  const { user } = useAuthStore();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return null;

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await feedService.createComment({ post_id: postId, content: trimmed });
      setContent("");
      onCommentCreated();
    } catch {
      toast.error("Failed to post reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center gap-3 border-b border-[#E1F1F0] px-4 py-3">
      <UserAvatar user={user} size="md" />
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        placeholder="Reply or @"
        className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none"
      />
      <button
        onClick={handleSubmit}
        disabled={!content.trim() || isSubmitting}
        className="rounded-full bg-[#27CEC5] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#20b5ad] disabled:opacity-50"
      >
        Reply
      </button>
    </div>
  );
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  const queryClient = useQueryClient();

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
              <div className="flex items-center gap-1">
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
                <PostActions post={post} onUpdate={handlePostUpdate} />
              </div>
            </div>
          </div>
        </article>

        {/* Reply Input */}
        <ReplyInput postId={postId} onCommentCreated={() => refetchComments()} />

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
