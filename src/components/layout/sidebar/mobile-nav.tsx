"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { UserAvatar } from "@/components/ui/user-avatar";
import { navItems } from "./nav-items";

export function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white lg:hidden">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2",
                isActive ? "text-[#27CEC5]" : "text-gray-400"
              )}
            >
              <item.icon className="h-6 w-6" />
            </Link>
          );
        })}
        {user && (
          <Link
            href="/profile"
            className="flex flex-col items-center gap-1 px-4 py-2"
          >
            <UserAvatar user={user} size="xs" />
          </Link>
        )}
      </div>
    </nav>
  );
}
