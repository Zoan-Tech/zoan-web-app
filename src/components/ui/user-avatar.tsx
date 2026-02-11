import Image from "next/image";
import { cn } from "@/lib/utils";

const sizeMap = {
  xs: { px: 24, text: "text-[10px]" },
  sm: { px: 32, text: "text-xs" },
  md: { px: 40, text: "text-sm" },
  lg: { px: 48, text: "text-lg" },
  xl: { px: 128, text: "text-3xl" },
} as const;

type AvatarSize = keyof typeof sizeMap;

interface UserAvatarProps {
  user: {
    avatar_url?: string | null;
    display_name?: string | null;
    username?: string | null;
  };
  size?: AvatarSize;
  className?: string;
}

export function UserAvatar({ user, size = "md", className }: UserAvatarProps) {
  const { px, text } = sizeMap[size];
  const initial = (user.display_name || user.username || "U")[0].toUpperCase();

  return (
    <div
      className={cn(
        "overflow-hidden rounded bg-gray-200 flex-shrink-0",
        className
      )}
      style={{ width: px, height: px }}
    >
      {user.avatar_url ? (
        <Image
          src={user.avatar_url}
          alt={user.display_name || "User"}
          width={px}
          height={px}
          className="h-full w-full object-cover"
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
      )}
    </div>
  );
}
