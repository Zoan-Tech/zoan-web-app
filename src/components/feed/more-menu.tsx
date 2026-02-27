"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useAuthStore } from "@/stores/auth";
import { toast } from "sonner";
import {
  BookmarkSimpleIcon,
  PushPinIcon,
  ChartBarIcon,
  CopyIcon,
  EyeSlashIcon,
  ProhibitIcon,
  TrashIcon,
  WarningCircleIcon,
  SpeakerSlashIcon,
} from "@phosphor-icons/react";

interface MenuItem {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  destructive?: boolean;
}

interface MoreMenuProps {
  /** User ID of the post/comment author */
  authorId: string;
  /** Called when "Delete" is clicked (author only) */
  onDelete?: () => void;
  /** Called when "Save" is clicked */
  onSave?: () => void;
  /** Whether the post/comment is already bookmarked */
  isBookmarked?: boolean;
  /** Called when "Saved" is clicked (remove bookmark) */
  onRemoveBookmark?: () => void;
  /** Called when "Mute" is clicked */
  onMute?: () => void;
  /** Called when "Block" is clicked */
  onBlock?: () => void;
  /** Called when "Report" is clicked */
  onReport?: () => void;
  /** The URL to copy for "Copy link" */
  copyUrl: string;
  /** Called when "Insights" is clicked (author only) */
  onInsights?: () => void;
}

export function MoreMenu({
  authorId,
  onDelete,
  onSave,
  isBookmarked,
  onRemoveBookmark,
  onMute,
  onBlock,
  onReport,
  copyUrl,
  onInsights,
}: MoreMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top?: number; bottom?: number; right: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const currentUser = useAuthStore((s) => s.user);
  const isAuthor = currentUser?.id === authorId;

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (open) {
      setOpen(false);
      return;
    }
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const menuHeight = 300; // approximate max menu height
      const right = window.innerWidth - rect.right;

      if (spaceBelow < menuHeight) {
        // Not enough space below — open above the trigger
        setPosition({ bottom: window.innerHeight - rect.top + 4, right });
      } else {
        setPosition({ top: rect.bottom + 4, right });
      }
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(copyUrl);
    toast.success("Link copied to clipboard");
    setOpen(false);
  };

  const wrap = (fn?: () => void) => () => {
    fn?.();
    setOpen(false);
  };

  const authorItems: (MenuItem | "divider")[] = [
    {
      label: "Insights",
      icon: <ChartBarIcon className="h-5 w-5" />,
      onClick: wrap(onInsights),
    },
    "divider",
    {
      label: isBookmarked ? "Saved" : "Save",
      icon: <BookmarkSimpleIcon className="h-5 w-5" weight={isBookmarked ? "fill" : "regular"} />,
      onClick: isBookmarked ? wrap(onRemoveBookmark) : wrap(onSave),
    },
    {
      label: "Pin",
      icon: <PushPinIcon className="h-5 w-5" />,
      onClick: wrap(onSave),
    },
    "divider",
    {
      label: "Delete",
      icon: <TrashIcon className="h-5 w-5" />,
      onClick: wrap(onDelete),
      destructive: true,
    },
    "divider",
    {
      label: "Copy link",
      icon: <CopyIcon className="h-5 w-5" />,
      onClick: handleCopyLink,
    },
  ];

  const otherItems: (MenuItem | "divider")[] = [
    {
      label: isBookmarked ? "Saved" : "Save",
      icon: <BookmarkSimpleIcon className="h-5 w-5" weight={isBookmarked ? "fill" : "regular"} />,
      onClick: isBookmarked ? wrap(onRemoveBookmark) : wrap(onSave),
    },
    {
      label: "Not interested",
      icon: <EyeSlashIcon className="h-5 w-5" />,
      onClick: wrap(),
    },
    "divider",
    {
      label: "Mute",
      icon: <SpeakerSlashIcon className="h-5 w-5" />,
      onClick: wrap(onMute),
    },
    {
      label: "Block",
      icon: <ProhibitIcon className="h-5 w-5" />,
      onClick: wrap(onBlock),
      destructive: true,
    },
    {
      label: "Report",
      icon: <WarningCircleIcon className="h-5 w-5" />,
      onClick: wrap(onReport),
      destructive: true,
    },
    "divider",
    {
      label: "Copy link",
      icon: <CopyIcon className="h-5 w-5" />,
      onClick: handleCopyLink,
    },
  ];

  const items = isAuthor ? authorItems : otherItems;

  return (
    <>
      <button
        ref={triggerRef}
        className="p-1 text-gray-400 hover:text-gray-600"
        onClick={handleToggle}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 256 256"
          fill="currentColor"
        >
          <path d="M144,128a16,16,0,1,1-16-16A16,16,0,0,1,144,128ZM60,112a16,16,0,1,0,16,16A16,16,0,0,0,60,112Zm136,0a16,16,0,1,0,16,16A16,16,0,0,0,196,112Z" />
        </svg>
      </button>
      {open &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-50 min-w-50 overflow-hidden rounded bg-[#F7F9F9] shadow-xl"
            style={{ top: position.top, bottom: position.bottom, right: position.right }}
            onClick={(e) => e.stopPropagation()}
          >
            {items.map((item, i) =>
              item === "divider" ? (
                <div
                  key={`d-${i}`}
                  className="border-t border-[#E1F1F0]"
                />
              ) : (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-[13px] transition-colors hover:bg-black/10 ${
                    item.destructive ? "text-red-500" : "text-black"
                  }`}
                >
                  <span>{item.label}</span>
                  <span className="ml-6 opacity-70">{item.icon}</span>
                </button>
              )
            )}
          </div>,
          document.body
        )}
    </>
  );
}
