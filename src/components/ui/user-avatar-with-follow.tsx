"use client";

import { useState } from "react";
import { UserAvatar } from "./user-avatar";
import { User } from "@/types/auth";
import { PlusIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { useFollowUser } from "@/hooks/use-follow-user";

interface UserAvatarWithFollowProps {
  user: User;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "xxl" | "xxxl";
  className?: string;
  showProfile?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function UserAvatarWithFollow({
  user,
  size = "md",
  className,
  showProfile = true,
  onFollowChange,
}: UserAvatarWithFollowProps) {
  const { user: currentUser } = useAuthStore();
  const { followUser } = useFollowUser();
  const [isHovering, setIsHovering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Don't show follow button for current user or if already following
  const isCurrentUser = currentUser?.id === user.id;
  // Use the prop value directly (updated by the hook's cache updates)
  const isFollowing = user.is_following || false;

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoading || isCurrentUser || !user.id) return;

    setIsLoading(true);
    try {
      const success = await followUser(user.id, user.username);
      if (success) {
        onFollowChange?.(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Hide follow button if current user, already following, or invalid user ID
  if (isCurrentUser || isFollowing || !user.id) {
    return <UserAvatar user={user} size={size} className={className} showProfile={showProfile} />;
  }

  return (
    <div className="relative inline-block">
      <UserAvatar user={user} size={size} className={className} showProfile={showProfile} />

      {/* Follow button overlay */}
      <button
        onClick={handleFollowClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        disabled={isLoading}
        className={cn(
          "absolute bottom-[-8px] right-[-8px] flex h-5 w-5 items-center justify-center rounded-full border-2 border-white transition-all z-10",
          "bg-gray-900 hover:bg-gray-800",
          isLoading && "opacity-50 cursor-wait"
        )}
      >
        <PlusIcon className="h-3 w-3 text-white" weight="bold" />
      </button>

      {/* Hover tooltip */}
      {isHovering && !isLoading && (
        <div
          className="absolute bottom-0 left-full ml-2 z-50 cursor-pointer"
          onClick={handleFollowClick}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div className="relative">
            <div
              className="rounded-lg bg-white border border-[#B0F1ED] px-3 py-2 whitespace-nowrap backdrop-blur-[12px]"
              style={{
                boxShadow: '0px 4px 10px 0px #E9FBFA'
              }}
            >
              <span className="text-xs font-medium text-gray-900">
                Follow @{user.username}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
