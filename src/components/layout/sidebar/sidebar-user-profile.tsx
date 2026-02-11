"use client";

import Link from "next/link";
import { useAuthStore } from "@/stores/auth";
import { UserAvatar } from "@/components/ui/user-avatar";

export function SidebarUserProfile() {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div className="mt-4">
      <Link
        href={`/profile/${user.id}`}
        className="block transition-opacity hover:opacity-80"
        title="Profile"
      >
        <UserAvatar user={user} size="lg" />
      </Link>
    </div>
  );
}
