"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col items-center justify-center gap-4">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-lg transition-colors",
              isActive
                ? "bg-[#27CEC5] text-white"
                : "text-gray-600 hover:bg-gray-100"
            )}
            title={item.label}
          >
            <item.icon className="h-6 w-6" />
          </Link>
        );
      })}
    </nav>
  );
}
