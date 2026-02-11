"use client";

import Link from "next/link";
import Image from "next/image";
import { UserAvatar } from "@/components/ui/user-avatar";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import {
  HeartIcon,
  ChatCircleIcon,
  ArrowsClockwiseIcon,
  BookmarkSimpleIcon,
  DotsThreeIcon,
} from "@phosphor-icons/react";
import { Post } from "@/types/feed";
import { formatRelativeTime, formatNumber, cn } from "@/lib/utils";
import { useState } from "react";
import { feedService } from "@/services/feed";
import { toast } from "sonner";

interface Props {
  post: Post;
  onUpdate?: (post: Post) => void;
}

export function PostCard({ post, onUpdate }: Props) {
  const [isLiking, setIsLiking] = useState(false);
  const [isReposting, setIsReposting] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);

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

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isBookmarking) return;
    setIsBookmarking(true);

    try {
      if (post.is_bookmarked) {
        await feedService.unbookmarkPost(post.id);
        onUpdate?.({
          ...post,
          is_bookmarked: false,
        });
      } else {
        await feedService.bookmarkPost(post.id);
        onUpdate?.({
          ...post,
          is_bookmarked: true,
        });
        toast.success("Added to bookmarks");
      }
    } catch (error) {
      toast.error("Failed to update bookmark");
    } finally {
      setIsBookmarking(false);
    }
  };

  return (
    <article className="border-b border-gray-100 bg-white px-4 py-4 transition-colors hover:bg-gray-50">
      <div className="flex gap-3">
        {/* Avatar */}
        <Link href={`/profile/${post.user.id}`} className="flex-shrink-0">
          <UserAvatar user={post.user} size="md" />
        </Link>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="flex items-center gap-1">
            <Link
              href={`/profile/${post.user.id}`}
              className="truncate font-semibold text-gray-900 hover:underline"
            >
              {post.user.display_name}
            </Link>
            {post.user.is_verified && <VerifiedBadge size="sm" />}
            <span className="text-gray-500">@{post.user.username}</span>
            <span className="text-gray-400">·</span>
            <span className="text-gray-500 text-sm">
              {formatRelativeTime(post.created_at)}
            </span>
            <button className="ml-auto p-1 text-gray-400 hover:text-gray-600">
              <DotsThreeIcon className="h-4 w-4" weight="bold" />
            </button>
          </div>

          {/* Post Content */}
          <p className="mt-1 whitespace-pre-wrap text-gray-900">{post.content}</p>

          {/* Media */}
          {post.media_urls && post.media_urls.length > 0 && (
            <div className="mt-3 grid gap-2 overflow-hidden rounded-xl">
              {post.media_urls.slice(0, 4).map((url, index) => (
                <div
                  key={index}
                  className="relative aspect-video overflow-hidden rounded-xl bg-gray-100"
                >
                  <Image
                    src={url}
                    alt="Post media"
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Poll */}
          {post.poll && (
            <div className="mt-3 rounded-xl border border-gray-200 p-3">
              <p className="font-medium text-gray-900">{post.poll.question}</p>
              <div className="mt-2 space-y-2">
                {post.poll.options.map((option) => (
                  <div
                    key={option.id}
                    className="relative overflow-hidden rounded-lg border border-gray-200 p-2"
                  >
                    <div
                      className="absolute inset-0 bg-[#E0FAF8]"
                      style={{ width: `${option.percentage}%` }}
                    />
                    <div className="relative flex items-center justify-between">
                      <span className="text-sm text-gray-700">{option.text}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {option.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {formatNumber(post.poll.total_votes)} votes
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="mt-3 flex items-center gap-6">
            <button
              onClick={handleLike}
              className={cn(
                "flex items-center gap-1 text-sm transition-colors",
                post.is_liked
                  ? "text-red-500"
                  : "text-gray-500 hover:text-red-500"
              )}
            >
              <HeartIcon
                className="h-5 w-5"
                weight={post.is_liked ? "fill" : "regular"}
              />
              {post.like_count > 0 && (
                <span>{formatNumber(post.like_count)}</span>
              )}
            </button>

            <Link
              href={`/post/${post.id}`}
              className="flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-[#27CEC5]"
            >
              <ChatCircleIcon className="h-5 w-5" />
              {post.reply_count > 0 && (
                <span>{formatNumber(post.reply_count)}</span>
              )}
            </Link>

            <button
              onClick={handleRepost}
              className={cn(
                "flex items-center gap-1 text-sm transition-colors",
                post.is_reposted
                  ? "text-green-500"
                  : "text-gray-500 hover:text-green-500"
              )}
            >
              <ArrowsClockwiseIcon className="h-5 w-5" />
              {post.repost_count > 0 && (
                <span>{formatNumber(post.repost_count)}</span>
              )}
            </button>

            <button
              onClick={handleBookmark}
              className={cn(
                "ml-auto text-sm transition-colors",
                post.is_bookmarked
                  ? "text-[#27CEC5]"
                  : "text-gray-500 hover:text-[#27CEC5]"
              )}
            >
              <BookmarkSimpleIcon
                className="h-5 w-5"
                weight={post.is_bookmarked ? "fill" : "regular"}
              />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
