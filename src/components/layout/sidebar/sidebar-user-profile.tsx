"use client";

import { useAuthStore } from "@/stores/auth";
import { UserAvatar } from "@/components/ui/user-avatar";

export function SidebarUserProfile() {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div className="px-4 py-4">
      <div
        className="block transition-opacity hover:opacity-80"
      >
        <UserAvatar user={user} size="md" />
      </div>
    </div>
  );
}
