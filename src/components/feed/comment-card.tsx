"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { feedService } from "@/services/feed";
import { UserAvatar } from "@/components/ui/user-avatar";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
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
} from "@phosphor-icons/react";
import { MoreMenu } from "./more-menu";

function CommentHeader({ comment, onContentClick }: { comment: Comment; onContentClick?: () => void }) {
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

      <p
        className={cn(
          "whitespace-pre-wrap text-gray-900 text-[12px]",
          onContentClick && "cursor-pointer"
        )}
        onClick={onContentClick}
      >
        {renderContentWithMentions(comment.content, comment.mentions)}
      </p>
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
}: {
  comment: Comment;
  liked: boolean;
  likeCount: number;
  onLike: () => void;
}) {
  return (
    <div className="mt-3 flex items-center gap-6" onClick={(e) => e.stopPropagation()}>
      <div className="flex w-10 items-center gap-1 text-sm text-gray-500">
        <ChatTeardropIcon className="h-4 w-4" />
        <span className="min-w-[1ch]">
          {comment.reply_count > 0 ? formatNumber(comment.reply_count) : ""}
        </span>
      </div>

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

function InlineReplyContent({ comment, onContentClick }: { comment: Comment; onContentClick?: () => void }) {
  const { liked, likeCount, handleLike } = useCommentLike(comment);

  return (
    <>
      <CommentHeader comment={comment} onContentClick={onContentClick} />
      <CommentActions
        comment={comment}
        liked={liked}
        likeCount={likeCount}
        onLike={handleLike}
      />
    </>
  );
}

export function CommentCard({ comment }: { comment: Comment }) {
  const router = useRouter();
  const { liked, likeCount, handleLike } = useCommentLike(comment);
  const shouldFetchReplies = comment.reply_count > 0 && comment.reply_count < 5;
  const { data: replies = [], isLoading: isLoadingReplies } = useQuery({
    queryKey: ["commentReplies", comment.id],
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
          <Link
            href={`/profile/${comment.user.id}`}
            onClick={(e) => e.stopPropagation()}
          >
            <UserAvatar user={comment.user} size="md" />
          </Link>
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
          <CommentHeader comment={comment} onContentClick={isClickable ? () => router.push(`/comment/${comment.id}`) : undefined} />
          <CommentActions
            comment={comment}
            liked={liked}
            likeCount={likeCount}
            onLike={handleLike}
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
              <Link
                href={`/profile/${reply.user.id}`}
                onClick={(e) => e.stopPropagation()}
              >
                <UserAvatar user={reply.user} size="md" />
              </Link>
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
              <InlineReplyContent comment={reply} onContentClick={replyClickable ? () => router.push(`/comment/${reply.id}`) : undefined} />
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
    </div>
  );
}
