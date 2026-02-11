"use client";

import { AppShell } from "@/components/layout";
import { MagnifyingGlassIcon, TrendUpIcon } from "@phosphor-icons/react";

export default function ExplorePage() {
  return (
    <AppShell>
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 px-4 py-3 backdrop-blur-lg">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            className="w-full rounded-full bg-gray-100 py-2.5 pl-10 pr-4 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#27CEC5]/20"
          />
        </div>
      </header>

      <div className="p-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <TrendUpIcon className="h-5 w-5 text-[#27CEC5]" />
            <h2 className="font-bold text-gray-900">Trending</h2>
          </div>

          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="border-b border-gray-100 pb-4 last:border-0 last:pb-0"
              >
                <p className="text-xs text-gray-500">Trending in Crypto</p>
                <p className="font-medium text-gray-900">#Web3</p>
                <p className="text-xs text-gray-500">12.5K posts</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
