"use client";

import Image from "next/image";
import { CaretRightIcon } from "@phosphor-icons/react";

interface FeedItem {
  id: string;
  user: string;
  userAvatar: string;
  action: "bought" | "sold";
  amount: string;
  token: string;
  tokenIcon: string;
}

const MOCK_FEED: FeedItem[] = [
  {
    id: "1",
    user: "arischen",
    userAvatar: "/mock/user-1.svg",
    action: "bought",
    amount: "10",
    token: "BTC",
    tokenIcon: "/mock/token-1.svg",
  },
  {
    id: "2",
    user: "julianvthorne",
    userAvatar: "/mock/user-1.svg",
    action: "bought",
    amount: "23",
    token: "JAKEUNI",
    tokenIcon: "/mock/token-2.svg",
  },
  {
    id: "3",
    user: "marcusvoss",
    userAvatar: "/mock/user-2.svg",
    action: "sold",
    amount: "10",
    token: "JAKEPOLY",
    tokenIcon: "/mock/token-1.svg",
  },
  {
    id: "4",
    user: "marcusvoss",
    userAvatar: "/mock/user-2.svg",
    action: "sold",
    amount: "10",
    token: "SOL",
    tokenIcon: "/mock/token-2.svg",
  },
];

export function LiveFeed() {
  return (
    <div className="px-4 py-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Live feed</h2>
        <button className="text-gray-400">
          <CaretRightIcon size={18} />
        </button>
      </div>
      <div className="space-y-4">
        {MOCK_FEED.map((item) => (
          <div key={item.id} className="flex items-center">
            {/* User avatar */}
            <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
              <Image
                src={item.userAvatar}
                alt={item.user}
                fill
                className="object-cover"
              />
            </div>

            {/* Username */}
            <span className="ml-3 min-w-0 flex-shrink-0 text-sm font-medium text-gray-900">
              {item.user}
            </span>

            {/* Action */}
            <span className="ml-auto text-sm font-medium text-[#27CEC5]">
              {item.action}
            </span>

            {/* Amount + Token */}
            <span className="ml-auto text-right text-sm font-semibold text-gray-900">
              {item.amount} {item.token}
            </span>

            {/* Token icon */}
            <div className="relative ml-2 h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
              <Image
                src={item.tokenIcon}
                alt={item.token}
                fill
                className="object-cover"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
