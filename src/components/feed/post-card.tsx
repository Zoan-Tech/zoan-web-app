"use client";

import Link from "next/link";
import { UserAvatarWithFollow } from "@/components/ui/user-avatar-with-follow";
import { UserAvatar } from "@/components/ui/user-avatar";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import {
  HeartIcon,
  ChatTeardropIcon,
  RepeatIcon,
  ArrowSquareOutIcon,
  QuotesIcon,
} from "@phosphor-icons/react";
import { MoreMenu } from "./more-menu";
import { Post, Comment } from "@/types/feed";
import { formatRelativeTime, formatNumber, cn } from "@/lib/utils";
import { renderContentWithMentions } from "@/lib/render-mentions";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { feedService } from "@/services/feed";
import { useAuthStore } from "@/stores/auth";
import { toast } from "sonner";
import { MediaGrid } from "@/components/ui/media-grid";
import { PollDisplay } from "@/components/ui/poll-display";
import { QuotePostModal } from "./quote-post-modal";

export function RepostedFromCard({ source, type }: { source: Post | Comment; type: "post" | "comment" }) {
  const router = useRouter();

  const link =
    type === "comment" && "post_id" in source
      ? `/post/${(source as Comment).post_id}/comment/${(source as Comment).id}`
      : `/post/${(source as Post).id}`;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(link);
  };

  return (
    <div
      onClick={handleClick}
      className="mt-2 cursor-pointer overflow-hidden rounded-xl border border-[#E1F1F0] transition-colors hover:bg-gray-50"
    >
      <div className="p-3">
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          <UserAvatar user={source.user} size="xs" showProfile={false} />
          <span className="text-xs font-semibold text-gray-900">
            {source.user.display_name || source.user.username}
          </span>
          {source.user.is_verified && <VerifiedBadge size="sm" />}
          <span className="text-xs text-gray-500">@{source.user.username}</span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-400">{formatRelativeTime(source.created_at)}</span>
        </div>
        {source.content && (
          <div className="text-xs text-gray-700 [&_p]:mb-1 [&_p:last-child]:mb-0">
            {renderContentWithMentions(
              source.content,
              type === "post"
                ? (source as Post).entities?.mentions
                : (source as Comment).mentions
            )}
          </div>
        )}
      </div>
      {source.medias?.length > 0 && (
        <div className="px-3 pb-3">
          <MediaGrid medias={source.medias} />
        </div>
      )}
    </div>
  );
}

interface Props {
  post: Post;
  onUpdate?: (post: Post) => void;
  onDelete?: (postId: string) => void;
}

export function PostCard({ post, onUpdate, onDelete }: Props) {
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const [isLiking, setIsLiking] = useState(false);
  const [isReposting, setIsReposting] = useState(false);
  const [showRepostMenu, setShowRepostMenu] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const repostMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showRepostMenu) return;
    function handleClickOutside(e: MouseEvent) {
      if (repostMenuRef.current && !repostMenuRef.current.contains(e.target as Node)) {
        setShowRepostMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showRepostMenu]);

  const displayUser = currentUser?.id === post.user.id
    ? { ...post.user, ...currentUser }
    : post.user;

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLiking) return;
    setIsLiking(true);

    try {
      if (post.is_liked) {
        await feedService.unlikePost(post.id);
        onUpdate?.({
          ...post,
          is_liked: false,
          like_count: post.like_count - 1,
        });
      } else {
        await feedService.likePost(post.id);
        onUpdate?.({
          ...post,
          is_liked: true,
          like_count: post.like_count + 1,
        });
      }
    } catch (error) {
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
        onUpdate?.({
          ...post,
          is_reposted: false,
          repost_count: post.repost_count - 1,
        });
      } else {
        await feedService.repost(post.id);
        onUpdate?.({
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

  const handleDelete = async () => {
    try {
      await feedService.deletePost(post.id);
      toast.success("Post deleted");
      onDelete?.(post.id);
    } catch {
      toast.error("Failed to delete post");
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  return (
    <>
    <article
      className="border-b border-[#E1F1F0] bg-white px-4 py-4"
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="shrink-0">
          <UserAvatarWithFollow
            user={displayUser}
            size="md"
          />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="flex items-start gap-1">
            <Link
              href={`/profile/${displayUser.id}`}
              className="truncate font-semibold text-gray-900 hover:underline text-sm align-top"
            >
              {displayUser.display_name}
            </Link>
            {displayUser.is_verified && <VerifiedBadge size="sm" />}
            <span className="text-gray-500 text-[12px] align-top">@{displayUser.username}</span>
            <div className="ml-auto justify-end flex items-center">
              <span className="p-1 text-gray-500 text-[12px]">
                {formatRelativeTime(post.created_at)}
              </span>
              <MoreMenu
                authorId={displayUser.id}
                onDelete={handleDelete}
                copyUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/post/${post.id}`}
              />
            </div>
          </div>

          {/* Post Content */}
          <div
            onClick={() => router.push(`/post/${post.id}`)}
            className="block text-gray-900 text-[12px] cursor-pointer align-top"
          >
            {renderContentWithMentions(post.content, post.entities?.mentions)}
          </div>

          {/* Media */}
          <MediaGrid medias={post.medias} />

          {/* Poll */}
          {post.poll && (
            <PollDisplay
              poll={post.poll}
              onVote={(updatedPoll) => onUpdate?.({ ...post, poll: updatedPoll })}
            />
          )}

          {/* Reposted from */}
          {post.reposted_from_post && (
            <RepostedFromCard source={post.reposted_from_post} type="post" />
          )}
          {post.reposted_from_comment && (
            <RepostedFromCard source={post.reposted_from_comment} type="comment" />
          )}

          {/* Actions */}
          <div className="mt-3 flex items-center gap-6">
            <Link
              href={`/post/${post.id}`}
              className="flex w-10 items-center gap-1 text-sm text-gray-500 transition-colors hover:text-[#27CEC5]"
            >
              <ChatTeardropIcon className="h-4 w-4" />
              <span className="min-w-[1ch]">
                {post.reply_count > 0 ? formatNumber(post.reply_count) : ""}
              </span>
            </Link>

            <div className="relative" ref={repostMenuRef}>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (post.is_reposted) { handleRepost(); } else { setShowRepostMenu((v) => !v); } }}
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
                    onClick={(e) => { e.stopPropagation(); setShowRepostMenu(false); handleRepost(); }}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-gray-900 transition-colors hover:bg-[#B0F1ED]/10 hover:cursor-pointer border-b border-[#B0F1ED]/50"
                  >
                    <RepeatIcon className="h-4 w-4 shrink-0" />
                    <span className="text-xs font-semibold">Repost</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowRepostMenu(false); setShowQuoteModal(true); }}
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
                post.is_liked
                  ? "text-red-500"
                  : "text-gray-500 hover:text-red-500"
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
        </div>
      </div>
    </article>

    {showQuoteModal && (
      <QuotePostModal
        post={post}
        onClose={() => setShowQuoteModal(false)}
        onSuccess={() =>
          onUpdate?.({ ...post, repost_count: post.repost_count + 1 })
        }
      />
    )}
    </>
  );
}
