"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";
import { useNotificationBadge } from "@/hooks/use-notification-badge";

export function SidebarNav() {
  const pathname = usePathname();
  const { unreadCount } = useNotificationBadge();

  return (
    <nav className="flex flex-1 flex-col items-center justify-center">
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
              item.className,
              !isActive && item.inactiveClassName
            )}
            title={item.label}
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
    </nav>
  );
}
