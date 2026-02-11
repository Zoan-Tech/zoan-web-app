"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { UserAvatar } from "@/components/ui/user-avatar";

export function CreatePost() {
  const { user } = useAuthStore();
  const router = useRouter();

  if (!user) return null;

  return (
    <div
      className="cursor-pointer px-4 py-4 border-b border-[#E1F1F0]"
      onClick={() => router.push("/create")}
    >
      <div className="flex items-center gap-3">
        <UserAvatar user={user} size="md" />
        <span className="text-sm text-gray-400">What&apos;s happening?</span>
      </div>
    </div>
  );
}
