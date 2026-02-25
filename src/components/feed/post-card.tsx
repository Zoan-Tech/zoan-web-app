"use client";

import Link from "next/link";
import { UserAvatarWithFollow } from "@/components/ui/user-avatar-with-follow";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import {
  HeartIcon,
  ChatTeardropIcon,
  RepeatIcon,
  ArrowSquareOutIcon,
} from "@phosphor-icons/react";
import { MoreMenu } from "./more-menu";
import { Post } from "@/types/feed";
import { formatRelativeTime, formatNumber, cn } from "@/lib/utils";
import { renderContentWithMentions } from "@/lib/render-mentions";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { feedService } from "@/services/feed";
import { useAuthStore } from "@/stores/auth";
import { toast } from "sonner";
import { MediaGrid } from "@/components/ui/media-grid";
import { PollDisplay } from "@/components/ui/poll-display";

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

  const handleRepost = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
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
    } catch (error) {
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
  );
}
