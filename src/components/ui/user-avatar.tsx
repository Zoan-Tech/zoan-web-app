"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";

const sizeMap = {
  xs: { px: 24, text: "text-[10px]" },
  sm: { px: 32, text: "text-xs" },
  md: { px: 40, text: "text-sm" },
  lg: { px: 48, text: "text-lg" },
  xl: { px: 64, text: "text-xl" },
  xxl: { px: 96, text: "text-2xl" },
  xxxl: { px: 128, text: "text-3xl" },
} as const;

type AvatarSize = keyof typeof sizeMap;

interface UserAvatarProps {
  user: {
    id: string;
    avatar_url?: string | null;
    display_name?: string | null;
    username?: string | null;
  };
  size?: AvatarSize;
  className?: string;
  showProfile?: boolean;
}

export function UserAvatar({ user, size = "md", className, showProfile = true }: UserAvatarProps) {
  const [showModal, setShowModal] = useState(false);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const { px, text } = sizeMap[size];
  const initial = (user.display_name || user.username || "U")[0].toUpperCase();

  const hasImageError = user.avatar_url === failedUrl;

  const content = user.avatar_url && !hasImageError ? (
    <Image
      src={user.avatar_url}
      alt={user.display_name || "User"}
      width={px}
      height={px}
      className="h-full w-full object-cover"
      onError={() => setFailedUrl(user.avatar_url || null)}
    />
  ) : (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-[#27CEC5] font-bold text-white",
        text
      )}
    >
      {initial}
    </div>
  );

  return (
    <>
      <div
        className={cn(
          "overflow-hidden rounded bg-gray-200 flex-shrink-0",
          !showProfile && user.avatar_url && "cursor-pointer",
          className
        )}
        style={{ width: px, height: px }}
        onClick={!showProfile && user.avatar_url ? () => setShowModal(true) : undefined}
      >
        {showProfile ? (
          <Link href={`/profile/${user.id}`} className="block w-full h-full">
            {content}
          </Link>
        ) : (
          content
        )}
      </div>

      {showModal && user.avatar_url && !hasImageError && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setShowModal(false)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowModal(false)}
              className="absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-700 shadow-md hover:bg-gray-100"
            >
              ✕
            </button>
            <Image
              src={user.avatar_url}
              alt={user.display_name || "User"}
              width={512}
              height={512}
              className="max-h-[85vh] w-auto rounded-lg object-contain"
              onError={() => setFailedUrl(user.avatar_url || null)}
            />
          </div>
        </div>
      )}
    </>
  );
}
