"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { UserAvatar } from "@/components/ui/user-avatar";
import { navItems } from "./nav-items";
import { useNotificationBadge } from "@/hooks/use-notification-badge";

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { unreadCount } = useNotificationBadge();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white lg:hidden">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const isNotifications = item.href === "/notifications";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex h-15 w-15 items-center justify-center rounded transition-colors",
                isActive ? "text-[#27CEC5]" : "text-[#272727] hover:bg-gray-100",
                item.className
              )}
            >
              <item.icon
                className={cn("h-6 w-6", item.iconClassName)}
                weight={isActive ? "fill" : "regular"}
              />
              {/* Red badge dot for unread notifications */}
              {isNotifications && unreadCount > 0 && (
                <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500" />
              )}
            </Link>
          );
        })}
        {user && (
          <div
            className="flex flex-col items-center gap-1 px-4 py-2"
          >
            <UserAvatar user={user} size="xs" />
          </div>
        )}
      </div>
    </nav>
  );
}
