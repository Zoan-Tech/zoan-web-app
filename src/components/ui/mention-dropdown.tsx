"use client";

import { User } from "@/types/auth";
import { UserAvatar } from "@/components/ui/user-avatar";
import { VerifiedBadge } from "@/components/ui/verified-badge";
import { useEffect, useRef } from "react";

interface MentionDropdownProps {
  results: User[];
  selectedIndex: number;
  onSelect: (user: User) => void;
  visible: boolean;
}

export function MentionDropdown({
  results,
  selectedIndex,
  onSelect,
  visible,
}: MentionDropdownProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.children[selectedIndex] as HTMLElement;
    if (selected) {
      selected.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (!visible || !results || results.length === 0) return null;

  return (
    <div
      ref={listRef}
      className="absolute left-0 right-0 z-50 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg"
    >
      {results.map((user, index) => (
        <button
          key={`${user.id}-${index}`}
          type="button"
          onMouseDown={(e) => {
            // Use mouseDown instead of click to fire before input blur
            e.preventDefault();
            onSelect(user);
          }}
          className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-gray-50 ${
            index === selectedIndex ? "bg-gray-50" : ""
          }`}
        >
          <UserAvatar user={user} size="xs" showProfile={false} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="truncate text-sm font-medium text-gray-900">
                {user.display_name}
              </span>
              {user.is_verified && <VerifiedBadge size="sm" />}
            </div>
            <span className="text-xs text-gray-500">@{user.username}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
