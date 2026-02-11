"use client";

import { SidebarLogo } from "./sidebar/sidebar-logo";
import { SidebarNav } from "./sidebar/sidebar-nav";
import { SidebarUserProfile } from "./sidebar/sidebar-user-profile";
import { MobileNav } from "./sidebar/mobile-nav";

interface Props {
  children: React.ReactNode;
}

export function AppShell({ children }: Props) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="fixed hidden h-full w-20 border-r border-gray-200 bg-white lg:block">
        <div className="flex h-full flex-col items-center py-4">
          <SidebarLogo />
          <SidebarNav />
          <SidebarUserProfile />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-20">
        <div className="mx-auto max-w-2xl pb-20 lg:pb-0">{children}</div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}
