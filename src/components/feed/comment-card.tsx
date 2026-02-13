"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { feedService } from "@/services/feed";
import { queryKeys } from "@/lib/query-keys";
import { UserAvatar } from "@/components/ui/user-avatar";
import { UserAvatarWithFollow } from "@/components/ui/user-avatar-with-follow";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { MentionDropdown } from "@/components/ui/mention-dropdown";
import { MentionHighlight } from "@/components/ui/mention-highlight";
import { Modal } from "@/components/ui/modal";
import { useAuthStore } from "@/stores/auth";
import { useMentionInput } from "@/hooks/use-mention-input";
import { formatRelativeTime, formatNumber, cn } from "@/lib/utils";
import { Comment } from "@/types/feed";
import { renderContentWithMentions } from "@/lib/render-mentions";
import { toast } from "sonner";
import {
  HeartIcon,
  ChatTeardropIcon,
  RepeatIcon,
  RobotIcon,
  ArrowSquareOutIcon,
  ChatsIcon,
  ImageSquareIcon,
  SmileyIcon,
  ListIcon,
  NotepadIcon,
  MapPinIcon,
  SpinnerGapIcon,
  DotsThreeIcon,
} from "@phosphor-icons/react";
import { MoreMenu } from "./more-menu";

function CommentHeader({ comment, onContentClick, onDelete }: { comment: Comment; onContentClick?: () => void; onDelete?: () => void }) {
  return (
    <>
      <div className="flex items-start gap-1">
        <Link
          href={`/profile/${comment.user.id}`}
          className="truncate font-semibold text-gray-900 hover:underline text-sm"
          onClick={(e) => e.stopPropagation()}
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
          <MoreMenu
            authorId={comment.user.id}
            onDelete={onDelete}
            copyUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/comment/${comment.id}`}
          />
        </div>
      </div>

      {comment.user.is_agent && (
        <div className="flex items-center gap-1 text-[11px] text-gray-400">
          <RobotIcon className="h-3.5 w-3.5" />
          <span>
            Automated by{" "}
            <span className="text-[#27CEC5]">@zoan</span>
          </span>
        </div>
      )}

      <div
        className={cn(
          "text-gray-900 text-[12px]",
          onContentClick && "cursor-pointer"
        )}
        onClick={onContentClick}
      >
        {renderContentWithMentions(comment.content, comment.mentions)}
      </div>
    </>
  );
}

export function useCommentLike(comment: Comment) {
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

  return { liked, likeCount, handleLike };
}

export function CommentActions({
  comment,
  liked,
  likeCount,
  onLike,
  onReplyClick,
}: {
  comment: Comment;
  liked: boolean;
  likeCount: number;
  onLike: () => void;
  onReplyClick?: () => void;
}) {
  return (
    <div className="mt-3 flex items-center gap-6" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={onReplyClick}
        className="flex w-10 items-center gap-1 text-sm text-gray-500 transition-colors hover:text-[#27CEC5]"
      >
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
        onClick={onLike}
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
  );
}

// --- Reply Modal ---

const replyToolbarItems = [
  { icon: ChatsIcon, label: "Quote" },
  { icon: ImageSquareIcon, label: "Image" },
  { icon: SmileyIcon, label: "Emoji" },
  { icon: ListIcon, label: "List" },
  { icon: NotepadIcon, label: "Note" },
  { icon: MapPinIcon, label: "Location" },
];

function ReplyModal({
  open,
  onClose,
  comment,
  onReplyCreated,
}: {
  open: boolean;
  onClose: () => void;
  comment: Comment;
  onReplyCreated: () => void;
}) {
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    content,
    setContent,
    mentionResults,
    showMentions,
    selectedIndex,
    handleKeyDown,
    selectMention,
    inputRef,
  } = useMentionInput();

  const setRef = useCallback(
    (el: HTMLInputElement | null) => {
      (inputRef as React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>).current = el;
    },
    [inputRef]
  );

  // Auto-focus when modal opens
  useEffect(() => {
    if (open) {
      // Small delay to allow modal transition
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [open, inputRef]);

  if (!user) return null;

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await feedService.createComment({
        post_id: comment.post_id,
        parent_comment_id: comment.id,
        content: trimmed,
      });
      setContent("");
      onReplyCreated();
      onClose();
    } catch {
      toast.error("Failed to post reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="sm:max-w-lg"
      header={
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <button
            onClick={onClose}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>
          <span className="text-sm font-semibold text-gray-900">Reply</span>
          <button className="rounded-full p-1 text-gray-400 hover:text-gray-600">
            <DotsThreeIcon className="h-5 w-5" weight="bold" />
          </button>
        </div>
      }
    >
      {/* Parent comment preview */}
      <div className="flex gap-3">
        <div className="flex w-10 flex-shrink-0 flex-col items-center">
          <UserAvatarWithFollow
            user={comment.user}
            size="md"
          />
          <div className="mt-1 mb-1 w-[1px] flex-1 rounded-full bg-[#D1E9E8]" />
        </div>
        <div className="min-w-0 flex-1 pb-3">
          <div className="flex items-center gap-1">
            <span className="truncate text-sm font-semibold text-gray-900">
              {comment.user.display_name}
            </span>
            {comment.user.is_verified && <VerifiedBadge size="sm" />}
            <span className="text-[12px] text-gray-500">
              @{comment.user.username}
            </span>
          </div>
          <div className="mt-1 mb-4 text-[12px] text-gray-900">
            {renderContentWithMentions(comment.content, comment.mentions)}
          </div>
        </div>
      </div>

      {/* Reply input row */}
      <div className="flex gap-3">
        <div className="flex w-10 flex-shrink-0 flex-col items-center">
          <UserAvatar user={user} size="md" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <MentionHighlight
                content={content}
                placeholder={`Reply to @${comment.user.username}`}
                className="min-h-[1.25rem] whitespace-nowrap text-[12px] leading-[1.5] text-gray-900"
              />
              <input
                ref={setRef}
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => {
                  if (handleKeyDown(e)) return;
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                className="absolute inset-0 w-full bg-transparent p-0 text-[12px] leading-[1.5] text-transparent caret-gray-900 outline-none"
              />
              <MentionDropdown
                results={mentionResults}
                selectedIndex={selectedIndex}
                onSelect={selectMention}
                visible={showMentions}
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
              className="flex-shrink-0 rounded-full bg-[#27CEC5] px-4 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-[#20b5ad] disabled:opacity-50"
            >
              {isSubmitting ? (
                <SpinnerGapIcon className="h-4 w-4 animate-spin" />
              ) : (
                "Reply"
              )}
            </button>
          </div>
          <div className="mt-2 flex items-center gap-4">
            {replyToolbarItems.map(({ icon: Icon, label }) => (
              <button
                key={label}
                type="button"
                className="text-gray-400 transition-colors hover:text-gray-600"
                onMouseDown={(e) => e.preventDefault()}
              >
                <Icon className="h-5 w-5" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// --- Comment Card ---

function InlineReplyContent({
  comment,
  onContentClick,
  onReplyClick,
  onDelete,
}: {
  comment: Comment;
  onContentClick?: () => void;
  onReplyClick?: () => void;
  onDelete?: () => void;
}) {
  const { liked, likeCount, handleLike } = useCommentLike(comment);

  return (
    <>
      <CommentHeader comment={comment} onContentClick={onContentClick} onDelete={onDelete} />
      <CommentActions
        comment={comment}
        liked={liked}
        likeCount={likeCount}
        onLike={handleLike}
        onReplyClick={onReplyClick}
      />
    </>
  );
}

export function CommentCard({ comment, onDelete }: { comment: Comment; onDelete?: (commentId: string) => void }) {
  const router = useRouter();
  const { liked, likeCount, handleLike } = useCommentLike(comment);
  const [replyTarget, setReplyTarget] = useState<Comment | null>(null);

  const handleDelete = async () => {
    try {
      await feedService.deleteComment(comment.id);
      toast.success("Comment deleted");
      onDelete?.(comment.id);
    } catch {
      toast.error("Failed to delete comment");
    }
  };
  const shouldFetchReplies = comment.reply_count > 0 && comment.reply_count < 5;
  const { data: replies = [], isLoading: isLoadingReplies, refetch: refetchReplies } = useQuery({
    queryKey: queryKeys.commentReplies.byCommentId(comment.id),
    queryFn: () => feedService.getCommentReplies(comment.id),
    enabled: shouldFetchReplies,
  });
  const isClickable = comment.reply_count > 0;
  const hasInlineReplies = replies.length > 0;
  const showThreadLine = hasInlineReplies || isLoadingReplies;

  return (
    <div className="border-b border-[#E1F1F0] px-4 py-4">
      {/* Parent comment row */}
      <div className="flex gap-3">
        <div className="flex w-10 flex-shrink-0 flex-col items-center">
          <UserAvatarWithFollow
            user={comment.user}
            size="md"
          />
          {showThreadLine && (
            <div className="mt-1 mb-1 w-[1px] flex-1 rounded-full bg-[#D1E9E8]" />
          )}
        </div>
        <div
          className={cn(
            "min-w-0 flex-1",
            showThreadLine && "pb-3"
          )}
        >
          <CommentHeader comment={comment} onContentClick={isClickable ? () => router.push(`/comment/${comment.id}`) : undefined} onDelete={handleDelete} />
          <CommentActions
            comment={comment}
            liked={liked}
            likeCount={likeCount}
            onLike={handleLike}
            onReplyClick={() => setReplyTarget(comment)}
          />
        </div>
      </div>

      {/* Inline reply rows */}
      {hasInlineReplies && replies.map((reply: Comment, i: number) => {
        const replyClickable = reply.reply_count > 0;
        const isLastReply = i === replies.length - 1;
        return (
          <div className="flex gap-3" key={reply.id}>
            <div className="flex w-10 flex-shrink-0 flex-col items-center">
              <UserAvatarWithFollow
                user={reply.user}
                size="md"
              />
              {!isLastReply && (
                <div className="mt-1 w-0.5 flex-1 rounded-full bg-[#D1E9E8]" />
              )}
            </div>
            <div
              className={cn(
                "min-w-0 flex-1",
                !isLastReply && "pb-3"
              )}
            >
              <InlineReplyContent
                comment={reply}
                onContentClick={replyClickable ? () => router.push(`/comment/${reply.id}`) : undefined}
                onReplyClick={() => setReplyTarget(reply)}
                onDelete={async () => {
                  try {
                    await feedService.deleteComment(reply.id);
                    toast.success("Comment deleted");
                    refetchReplies();
                  } catch {
                    toast.error("Failed to delete comment");
                  }
                }}
              />
            </div>
          </div>
        );
      })}

      {/* Loading state */}
      {isLoadingReplies && (
        <div className="flex gap-3">
          <div className="flex w-10 flex-shrink-0 justify-center py-2">
            <LoadingSpinner size="sm" />
          </div>
          <div />
        </div>
      )}

      {/* Reply Modal */}
      {replyTarget && (
        <ReplyModal
          open={!!replyTarget}
          onClose={() => setReplyTarget(null)}
          comment={replyTarget}
          onReplyCreated={() => refetchReplies()}
        />
      )}
    </div>
  );
}
