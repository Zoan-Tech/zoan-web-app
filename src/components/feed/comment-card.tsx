"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Agent } from "@/lib/agents";
import { PostToolbar } from "@/components/ui/post-toolbar";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Comment, CreatePollRequest } from "@/types/feed";
import { renderContentWithMentions } from "@/lib/render-mentions";
import { MediaGrid } from "@/components/ui/media-grid";
import { PollDisplay } from "@/components/ui/poll-display";
import { PollCreator } from "@/components/ui/poll-creator";
import { toast } from "sonner";
import {
  HeartIcon,
  ChatTeardropIcon,
  RepeatIcon,
  QuotesIcon,
  RobotIcon,
  SpinnerGapIcon,
  DotsThreeIcon,
  XIcon,
  ChartLineIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import { ImagePreviewModal } from "@/components/ui/image-preview-modal";
import { MoreMenu } from "./more-menu";
import { QuotePostModal } from "./quote-post-modal";
import { BookmarkModal } from "./bookmark-modal";
import { bookmarkService } from "@/services/bookmark";

function CommentHeader({ comment, onContentClick, onDelete, onSave, isBookmarked, onRemoveBookmark }: { comment: Comment; onContentClick?: () => void; onDelete?: () => void; onSave?: () => void; isBookmarked?: boolean; onRemoveBookmark?: () => void }) {
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
            onSave={onSave}
            isBookmarked={isBookmarked}
            onRemoveBookmark={onRemoveBookmark}
            copyUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/post/${comment.post_id}/comment/${comment.id}`}
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
      <MediaGrid medias={comment.medias} />
      {comment.poll && <PollDisplay poll={comment.poll} />}
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

export function useCommentBookmark(comment: Comment) {
  const [isBookmarked, setIsBookmarked] = useState(comment.is_bookmarked);
  const [bookmarkCount, setBookmarkCount] = useState(comment.bookmark_count);
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const handleRemoveBookmark = async () => {
    try {
      await bookmarkService.removeCommentBookmark(comment.id);
      setIsBookmarked(false);
      setBookmarkCount((c) => c - 1);
      setShowRemoveConfirm(false);
    } catch {
      toast.error("Failed to remove bookmark");
    }
  };

  return { isBookmarked, bookmarkCount, showBookmarkModal, setShowBookmarkModal, showRemoveConfirm, setShowRemoveConfirm, handleRemoveBookmark };
}

export function CommentActions({
  comment,
  liked,
  likeCount,
  replyCount,
  onLike,
  onReplyClick,
}: {
  comment: Comment;
  liked: boolean;
  likeCount: number;
  replyCount?: number;
  onLike: () => void;
  onReplyClick?: () => void;
}) {
  const queryClient = useQueryClient();
  const [showRepostMenu, setShowRepostMenu] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [isReposted, setIsReposted] = useState(comment.is_reposted);
  const [repostCount, setRepostCount] = useState(comment.repost_count);
  const [isReposting, setIsReposting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showRepostMenu) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowRepostMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showRepostMenu]);

  const handleRepost = async () => {
    if (isReposting) return;
    setIsReposting(true);
    try {
      if (isReposted) {
        await feedService.unrepostComment(comment.id);
        setIsReposted(false);
        setRepostCount((c) => c - 1);
      } else {
        await feedService.createPost({ content: "", repost_comment_id: comment.id });
        setIsReposted(true);
        setRepostCount((c) => c + 1);
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.feed.list() });
    } catch {
      toast.error("Failed to update repost");
    } finally {
      setIsReposting(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/post/${comment.post_id}/comment/${comment.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  return (
    <>
      <div className="mt-3 flex items-center gap-15" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onReplyClick}
          className="flex w-10 items-center gap-1 text-sm text-gray-500 transition-colors hover:text-[#27CEC5]"
        >
          <ChatTeardropIcon className="h-4 w-4" />
          <span className="min-w-[1ch]">
            {(replyCount ?? comment.reply_count) > 0 ? formatNumber(replyCount ?? comment.reply_count) : ""}
          </span>
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => { if (isReposted) { handleRepost(); } else { setShowRepostMenu((v) => !v); } }}
            className={cn(
              "flex w-10 items-center gap-1 text-sm transition-colors",
              isReposted ? "text-green-500" : "text-gray-500 hover:text-green-500"
            )}
          >
            <RepeatIcon className="h-4 w-4" />
            <span className="min-w-[1ch]">
              {repostCount > 0 ? formatNumber(repostCount) : ""}
            </span>
          </button>

          {showRepostMenu && (
            <div className="absolute bottom-full left-0 z-50 mb-2 overflow-hidden rounded bg-white border border-[#B0F1ED]/50 shadow backdrop-blur-md">
              <button
                onClick={() => { setShowRepostMenu(false); handleRepost(); }}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-gray-900 transition-colors hover:bg-[#B0F1ED]/10 hover:cursor-pointer border-b border-[#B0F1ED]/50"
              >
                <RepeatIcon className="h-4 w-4 shrink-0" />
                <span className="text-xs font-semibold">Repost</span>
              </button>
              <button
                onClick={() => { setShowRepostMenu(false); setShowQuoteModal(true); }}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-gray-900 transition-colors hover:bg-[#B0F1ED]/10 hover:cursor-pointer"
              >
                <QuotesIcon className="h-4 w-4 shrink-0" />
                <span className="text-xs font-semibold">Quote</span>
              </button>
            </div>
          )}
        </div>

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

        <div className="flex items-center gap-1 text-sm text-gray-400">
          <ChartLineIcon className="h-4 w-4" />
          <span className="min-w-[1ch]">
            {comment.view_count > 0 ? formatNumber(comment.view_count) : ""}
          </span>
        </div>

      </div>

      {showQuoteModal && (
        <QuotePostModal
          post={comment}
          repostCommentId={comment.id}
          onClose={() => setShowQuoteModal(false)}
          onSuccess={() => setShowQuoteModal(false)}
        />
      )}
    </>
  );
}

// --- Reply Modal ---

const MAX_FILES = 4;


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
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [showPoll, setShowPoll] = useState(false);
  const [poll, setPoll] = useState<CreatePollRequest | null>(null);

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

  useEffect(() => {
    const urls = mediaFiles.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [mediaFiles]);

  // Auto-focus when modal opens
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [open, inputRef]);

  const handlePaste = (e: React.ClipboardEvent) => {
    const images = Array.from(e.clipboardData.items)
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter((f): f is File => f !== null);
    if (!images.length) return;
    e.preventDefault();
    setMediaFiles((prev) => [...prev, ...images].slice(0, MAX_FILES));
  };

  const mentionAgent = (agent: Agent) => {
    const handle = agent.username || agent.name || agent.display_name || agent.id;
    const el = inputRef.current;
    const pos = el?.selectionStart ?? content.length;
    const mention = `@${handle} `;
    setContent(content.slice(0, pos) + mention + content.slice(pos));
    requestAnimationFrame(() => {
      if (el) {
        const newPos = pos + mention.length;
        el.focus();
        el.setSelectionRange(newPos, newPos);
      }
    });
  };

  const insertEmoji = (emoji: string) => {
    const el = inputRef.current;
    const pos = el?.selectionStart ?? content.length;
    const newContent = content.slice(0, pos) + emoji + content.slice(pos);
    setContent(newContent);
    requestAnimationFrame(() => {
      if (el) {
        el.setSelectionRange(pos + emoji.length, pos + emoji.length);
      }
    });
  };

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
        medias: mediaFiles.length > 0 ? mediaFiles : undefined,
        poll: poll ?? undefined,
      });
      setContent("");
      setMediaFiles([]);
      setShowPoll(false);
      setPoll(null);
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
      {/* Scrollable area: parent comment preview + reply text input only */}
      <div className="max-h-[50vh] overflow-y-auto">
        {/* Parent comment preview */}
        <div className="flex gap-3">
          <div className="flex w-10 shrink-0 flex-col items-center">
            <UserAvatarWithFollow
              user={comment.user}
              size="md"
            />
            <div className="mt-1 mb-1 w-px flex-1 rounded-full bg-[#D1E9E8]" />
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

        {/* Reply text input + submit button */}
        <div className="flex gap-3">
          <div className="flex w-10 shrink-0 flex-col items-center">
            <UserAvatar user={user} size="md" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <MentionHighlight
                  content={content}
                  placeholder={`Reply to @${comment.user.username}`}
                  className="min-h-5 whitespace-nowrap text-[12px] leading-normal text-gray-900"
                />
                <input
                  ref={setRef}
                  type="text"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onPaste={handlePaste}
                  onKeyDown={(e) => {
                    if (handleKeyDown(e)) return;
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  className="absolute inset-0 w-full bg-transparent p-0 text-[12px] leading-normal text-transparent caret-gray-900 outline-none"
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
                className="shrink-0 rounded-full bg-[#27CEC5] px-4 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-[#20b5ad] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <SpinnerGapIcon className="h-4 w-4 animate-spin" />
                ) : (
                  "Reply"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar — outside overflow so the agents dropdown is never clipped */}
      <div className="mt-2 pl-13">
        <PostToolbar
          onFilesSelected={(files) => setMediaFiles((prev) => [...prev, ...files].slice(0, MAX_FILES))}
          imageDisabled={mediaFiles.length >= MAX_FILES}
          onAgentMention={mentionAgent}
          showPoll={showPoll}
          onPollToggle={() => { setShowPoll((v) => !v); if (showPoll) setPoll(null); }}
          onEmojiSelect={insertEmoji}
          className="gap-4"
        />
        {showPoll && (
          <div className="mt-2">
            <PollCreator
              onChange={setPoll}
              onRemove={() => { setShowPoll(false); setPoll(null); }}
            />
          </div>
        )}

        {/* Previews */}
        {previews.length > 0 && (
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {previews.map((src, i) => (
              <div key={i} className="relative shrink-0">
                <Image
                  src={src}
                  alt={`preview-${i}`}
                  width={64}
                  height={64}
                  className="h-16 w-16 cursor-pointer rounded-lg object-cover"
                  unoptimized
                  onClick={() => setPreviewSrc(src)}
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setMediaFiles((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-800 text-white"
                >
                  <XIcon className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <ImagePreviewModal src={previewSrc} onClose={() => setPreviewSrc(null)} />
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
  const { isBookmarked, showBookmarkModal, setShowBookmarkModal, showRemoveConfirm, setShowRemoveConfirm, handleRemoveBookmark } = useCommentBookmark(comment);

  return (
    <>
      <CommentHeader comment={comment} onContentClick={onContentClick} onDelete={onDelete} onSave={() => setShowBookmarkModal(true)} isBookmarked={isBookmarked} onRemoveBookmark={() => setShowRemoveConfirm(true)} />
      <CommentActions
        comment={comment}
        liked={liked}
        likeCount={likeCount}
        onLike={handleLike}
        onReplyClick={onReplyClick}
      />
      {showBookmarkModal && (
        <BookmarkModal
          onSave={(collectionId) => bookmarkService.bookmarkComment(comment.id, collectionId)}
          onClose={() => setShowBookmarkModal(false)}
          onSuccess={() => { setShowBookmarkModal(false); }}
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

export function CommentCard({ comment, onDelete }: { comment: Comment; onDelete?: (commentId: string) => void }) {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const { liked, likeCount, handleLike } = useCommentLike(comment);
  const { isBookmarked, showBookmarkModal, setShowBookmarkModal, showRemoveConfirm, setShowRemoveConfirm, handleRemoveBookmark } = useCommentBookmark(comment);

  const mergedComment = currentUser?.id === comment.user.id
    ? { ...comment, user: { ...comment.user, ...currentUser } }
    : comment;
  const [replyTarget, setReplyTarget] = useState<Comment | null>(null);
  const [replyCount, setReplyCount] = useState(comment.reply_count);

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
        <div className="flex w-10 shrink-0 flex-col items-center">
          <UserAvatarWithFollow
            user={mergedComment.user}
            size="md"
          />
          {showThreadLine && (
            <div className="mt-1 mb-1 w-px flex-1 rounded-full bg-[#D1E9E8]" />
          )}
        </div>
        <div
          className={cn(
            "min-w-0 flex-1",
            showThreadLine && "pb-3"
          )}
        >
          <CommentHeader comment={mergedComment} onContentClick={isClickable ? () => router.push(`/post/${mergedComment.post_id}/comment/${mergedComment.id}`) : undefined} onDelete={handleDelete} onSave={() => setShowBookmarkModal(true)} isBookmarked={isBookmarked} onRemoveBookmark={() => setShowRemoveConfirm(true)} />
          <CommentActions
            comment={mergedComment}
            liked={liked}
            likeCount={likeCount}
            replyCount={replyCount}
            onLike={handleLike}
            onReplyClick={() => setReplyTarget(comment)}
          />
        </div>
      </div>

      {/* Inline reply rows */}
      {hasInlineReplies && replies.map((reply: Comment, i: number) => {
        const mergedReply = currentUser?.id === reply.user.id
          ? { ...reply, user: { ...reply.user, ...currentUser } }
          : reply;
        const replyClickable = mergedReply.reply_count > 0;
        const isLastReply = i === replies.length - 1;
        return (
          <div className="flex gap-3" key={mergedReply.id}>
            <div className="flex w-10 shrink-0 flex-col items-center">
              <UserAvatarWithFollow
                user={mergedReply.user}
                size="md"
              />
              {!isLastReply && (
                <div className="mt-1 w-px flex-1 rounded-full bg-[#D1E9E8]" />
              )}
            </div>
            <div
              className={cn(
                "min-w-0 flex-1",
                !isLastReply && "pb-3"
              )}
            >
              <InlineReplyContent
                comment={mergedReply}
                onContentClick={replyClickable ? () => router.push(`/post/${mergedReply.post_id}/comment/${mergedReply.id}`) : undefined}
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
          <div className="flex w-10 shrink-0 justify-center py-2">
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
          onReplyCreated={() => {
            if (replyTarget?.id === comment.id) setReplyCount((c) => c + 1);
            refetchReplies();
          }}
        />
      )}

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
    </div>
  );
}
