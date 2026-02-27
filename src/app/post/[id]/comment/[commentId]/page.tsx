"use client";

import { useRef, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { feedService } from "@/services/feed";
import { AppShell } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { PageContent } from "@/components/ui/page-content";
import { UserAvatarWithFollow } from "@/components/ui/user-avatar-with-follow";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  CommentCard,
  ReplyInput,
  MoreMenu,
  useCommentLike,
  useCommentBookmark,
  CommentActions,
} from "@/components/feed";
import { bookmarkService } from "@/services/bookmark";
import { BookmarkModal } from "@/components/feed/bookmark-modal";
import { Modal } from "@/components/ui/modal";
import { formatRelativeTime } from "@/lib/utils";
import { renderContentWithMentions } from "@/lib/render-mentions";
import { MediaGrid } from "@/components/ui/media-grid";
import { PollDisplay } from "@/components/ui/poll-display";
import { Comment, CommentEventData } from "@/types/feed";
import { useSSE } from "@/providers/sse-provider";
import {
  CaretLeftIcon,
  RobotIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { queryKeys } from "@/lib/query-keys";

function ParentCommentArticle({ comment, onDelete }: { comment: Comment; onDelete?: () => void }) {
  const { liked, likeCount, handleLike } = useCommentLike(comment);
  const {
    isBookmarked,
    showBookmarkModal,
    setShowBookmarkModal,
    showRemoveConfirm,
    setShowRemoveConfirm,
    handleRemoveBookmark,
  } = useCommentBookmark(comment);

  return (
    <>
      <article className="border-b border-[#E1F1F0] px-4 py-4">
        <div className="flex gap-3">
          <div className="shrink-0">
            <UserAvatarWithFollow user={comment.user} size="md" />
          </div>

          <div className="min-w-0 flex-1">
            {/* Header */}
            <div className="flex items-start gap-1">
              <Link
                href={`/profile/${comment.user.id}`}
                className="truncate font-semibold text-gray-900 hover:underline text-sm"
              >
                {comment.user.display_name}
              </Link>
              {comment.user.is_verified && <VerifiedBadge size="sm" />}
              <span className="text-gray-500 text-[12px]">@{comment.user.username}</span>
              <div className="ml-auto flex items-center justify-end">
                <span className="p-1 text-gray-500 text-[12px]">
                  {formatRelativeTime(comment.created_at)}
                </span>
                <MoreMenu
                  authorId={comment.user.id}
                  onDelete={onDelete}
                  onSave={() => setShowBookmarkModal(true)}
                  isBookmarked={isBookmarked}
                  onRemoveBookmark={() => setShowRemoveConfirm(true)}
                  copyUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/post/${comment.post_id}/comment/${comment.id}`}
                />
              </div>
            </div>

            {comment.user.is_agent && (
              <div className="flex items-center gap-1 text-[11px] text-gray-400">
                <RobotIcon className="h-3.5 w-3.5" />
                <span>Automated by <span className="text-[#27CEC5]">@zoan</span></span>
              </div>
            )}

            {/* Content */}
            <div className="text-gray-900 text-[12px]">
              {renderContentWithMentions(comment.content, comment.mentions)}
            </div>

            {/* Media */}
            <MediaGrid medias={comment.medias} />

            {/* Poll */}
            {comment.poll && <PollDisplay poll={comment.poll} />}

            {/* Actions */}
            <div className="mt-3">
              <CommentActions
                comment={comment}
                liked={liked}
                likeCount={likeCount}
                onLike={handleLike}
              />
            </div>
          </div>
        </div>
      </article>

      {showBookmarkModal && (
        <BookmarkModal
          onSave={(collectionId) => bookmarkService.bookmarkComment(comment.id, collectionId)}
          onClose={() => setShowBookmarkModal(false)}
          onSuccess={() => setShowBookmarkModal(false)}
        />
      )}
      <Modal open={showRemoveConfirm} onClose={() => setShowRemoveConfirm(false)} title="Remove bookmark?">
        <p className="text-sm text-gray-600 mb-6">This will remove this comment from your bookmarks.</p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setShowRemoveConfirm(false)} className="rounded-full px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
          <button onClick={handleRemoveBookmark} className="rounded-full px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 transition-colors">Remove</button>
        </div>
      </Modal>
    </>
  );
}

export default function CommentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const commentId = params.commentId as string;
  const replyInputRef = useRef<HTMLInputElement>(null);

  const {
    data: comment,
    isLoading: isCommentLoading,
    isError: isCommentError,
  } = useQuery({
    queryKey: queryKeys.comment.byId(commentId),
    queryFn: () => feedService.getComment(commentId),
  });

  const {
    data: replies,
    isLoading: isRepliesLoading,
    refetch: refetchReplies,
  } = useQuery({
    queryKey: queryKeys.commentReplies.byCommentId(commentId),
    queryFn: () => feedService.getCommentReplies(commentId),
    enabled: !!comment,
  });

  // SSE for real-time reply updates
  const handleCommentCreated = useCallback(async (data: CommentEventData) => {
    try {
      // Only process if this is a reply to the comment we're viewing
      if (data.parent_comment_id !== commentId) {
        return;
      }

      // Refetch replies to get the latest data
      // This is more reliable than manual cache updates and handles all edge cases
      await refetchReplies();

      // Show notification for agent replies
      if (data.user.is_agent) {
        toast.info('Agent replied to your comment!');
      }
    } catch {
      // Silently ignore refetch errors
    }
  }, [commentId, refetchReplies]);

  // Subscribe to SSE events (shared with PostDetail)
  const { subscribe } = useSSE();

  useEffect(() => {
    const unsubscribe = subscribe('comment-detail', handleCommentCreated);
    return unsubscribe;
  }, [subscribe, handleCommentCreated]);

  if (isCommentLoading) {
    return (
      <AppShell>
        <PageHeader title="Reply" />
        <PageContent>
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </PageContent>
      </AppShell>
    );
  }

  if (isCommentError || !comment) {
    return (
      <AppShell>
        <PageHeader title="Reply" />
        <PageContent>
          <div className="flex flex-col items-center gap-3 py-12">
            <p className="text-sm text-gray-500">Comment not found</p>
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
          <span className="mx-auto text-sm font-medium text-gray-900">Reply</span>
        </div>
      </PageHeader>

      <PageContent>
        {/* Parent Comment */}
        <ParentCommentArticle
          comment={comment}
          onDelete={async () => {
            try {
              await feedService.deleteComment(comment.id);
              toast.success("Comment deleted");
              router.back();
            } catch {
              toast.error("Failed to delete comment");
            }
          }}
        />

        {/* Reply Input */}
        <ReplyInput
          postId={comment.post_id}
          parentId={commentId}
          onReplyCreated={() => refetchReplies()}
          inputRef={replyInputRef}
        />

        {/* Replies */}
        {isRepliesLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : replies && replies.length > 0 ? (
          replies.map((reply) => (
            <CommentCard key={reply.id} comment={reply} onDelete={() => refetchReplies()} />
          ))
        ) : null}
      </PageContent>
    </AppShell>
  );
}
