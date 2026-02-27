"use client";

import { useState, useRef, useEffect } from "react";
import { feedService } from "@/services/feed";
import { formatNumber, cn } from "@/lib/utils";
import { Post } from "@/types/feed";
import { toast } from "sonner";
import {
  HeartIcon,
  ChatTeardropIcon,
  RepeatIcon,
  QuotesIcon,
  ChartLineIcon,
} from "@phosphor-icons/react";
import { QuotePostModal } from "./quote-post-modal";

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
  const [showRepostMenu, setShowRepostMenu] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
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

  return (
    <>
      <div className="flex items-center gap-15">
        <button
          onClick={onCommentClick}
          className="flex w-10 items-center gap-1 text-sm text-gray-500 transition-colors hover:text-[#27CEC5]"
        >
          <ChatTeardropIcon className="h-4 w-4" />
          <span className="min-w-[1ch]">
            {post.reply_count > 0 ? formatNumber(post.reply_count) : ""}
          </span>
        </button>

        {/* Repost dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => { if (post.is_reposted) { handleRepost(); } else { setShowRepostMenu((v) => !v); } }}
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

          {showRepostMenu && (
            <div className="absolute bottom-full left-0 z-50 mb-2 overflow-hidden rounded bg-white border border-[#B0F1ED]/50 shadow backdrop-blur-md">
              <button
                onClick={() => {
                  setShowRepostMenu(false);
                  handleRepost();
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-gray-900 transition-colors hover:bg-[#B0F1ED]/10 hover:cursor-pointer border-b border-[#B0F1ED]/50"
              >
                <RepeatIcon className="h-4 w-4 shrink-0" />
                <span className="text-xs font-semibold">Repost</span>
              </button>
              <button
                onClick={() => {
                  setShowRepostMenu(false);
                  setShowQuoteModal(true);
                }}
                className="flex w-full items-center gap-3 px-3 py-2 text-left text-gray-900 transition-colors hover:bg-[#B0F1ED]/10 hover:cursor-pointer"
              >
                <QuotesIcon className="h-4 w-4 shrink-0" />
                <span className="text-xs font-semibold">Quote</span>
              </button>
            </div>
          )}
        </div>

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

        <div className="flex items-center gap-1 text-sm text-gray-400">
          <ChartLineIcon className="h-4 w-4" />
          <span className="min-w-[1ch]">
            {post.view_count > 0 ? formatNumber(post.view_count) : ""}
          </span>
        </div>
      </div>

      {showQuoteModal && (
        <QuotePostModal
          post={post}
          onClose={() => setShowQuoteModal(false)}
          onSuccess={() =>
            onUpdate({ ...post, repost_count: post.repost_count + 1 })
          }
        />
      )}

    </>
  );
}
