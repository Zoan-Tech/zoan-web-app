"use client";

import { useState } from "react";
import { feedService } from "@/services/feed";
import { formatNumber, cn } from "@/lib/utils";
import { Post } from "@/types/feed";
import { toast } from "sonner";
import {
  HeartIcon,
  ChatTeardropIcon,
  RepeatIcon,
  ArrowSquareOutIcon,
} from "@phosphor-icons/react";

export function PostActions({
  post,
  onUpdate,
  onCommentClick,
}: {
  post: Post;
  onUpdate: (post: Post) => void;
  onCommentClick?: () => void;
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
      <button
        onClick={onCommentClick}
        className="flex w-10 items-center gap-1 text-sm text-gray-500 transition-colors hover:text-[#27CEC5]"
      >
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
