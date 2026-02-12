"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { feedService } from "@/services/feed";
import { UserAvatar } from "@/components/ui/user-avatar";
import { MentionDropdown } from "@/components/ui/mention-dropdown";
import { MentionHighlight } from "@/components/ui/mention-highlight";
import { useAuthStore } from "@/stores/auth";
import { useMentionInput } from "@/hooks/use-mention-input";
import { toast } from "sonner";
import {
  ChatsIcon,
  ImageSquareIcon,
  SmileyIcon,
  ListIcon,
  NotepadIcon,
  MapPinIcon,
  SpinnerGapIcon,
} from "@phosphor-icons/react";

export function ReplyInput({
  postId,
  parentId,
  onReplyCreated,
  inputRef: externalInputRef,
}: {
  postId: string;
  parentId?: string;
  onReplyCreated: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    content,
    setContent,
    mentionResults,
    showMentions,
    selectedIndex,
    handleKeyDown,
    selectMention,
    inputRef,
  } = useMentionInput();

  // Merge refs: internal mention ref + external ref
  const setRef = useCallback(
    (el: HTMLInputElement | null) => {
      (inputRef as React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>).current = el;
      if (externalInputRef && "current" in externalInputRef) {
        (externalInputRef as React.RefObject<HTMLInputElement | null>).current = el;
      }
    },
    [inputRef, externalInputRef]
  );

  useEffect(() => {
    if (!isFocused) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (!content.trim()) {
          setIsFocused(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFocused, content]);

  if (!user) return null;

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await feedService.createComment({
        post_id: postId,
        parent_comment_id: parentId,
        content: trimmed,
      });
      setContent("");
      setIsFocused(false);
      onReplyCreated();
    } catch {
      toast.error("Failed to post reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toolbarItems = [
    { icon: ChatsIcon, label: "Quote" },
    { icon: ImageSquareIcon, label: "Image" },
    { icon: SmileyIcon, label: "Emoji" },
    { icon: ListIcon, label: "List" },
    { icon: NotepadIcon, label: "Note" },
    { icon: MapPinIcon, label: "Location" },
  ];

  return (
    <div ref={containerRef} className="border-b border-[#E1F1F0] px-4 py-3">
      <div className="flex items-center gap-3">
        <UserAvatar user={user} size="md" />
        <div className="relative flex-1">
          <MentionHighlight
            content={content}
            placeholder="Reply or @"
            className="min-h-[1.25rem] whitespace-nowrap text-sm leading-[1.5] text-gray-900"
          />
          <input
            ref={setRef}
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={(e) => {
              if (handleKeyDown(e)) return;
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            className="absolute inset-0 w-full bg-transparent p-0 text-sm leading-[1.5] text-transparent caret-gray-900 outline-none"
          />
          <MentionDropdown
            results={mentionResults}
            selectedIndex={selectedIndex}
            onSelect={selectMention}
            visible={showMentions}
          />
        </div>
        {isFocused && (
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            className="flex-shrink-0 rounded-full bg-[#27CEC5] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#20b5ad] disabled:opacity-50"
          >
            {isSubmitting ? (
              <SpinnerGapIcon className="h-4 w-4 animate-spin" />
            ) : (
              "Reply"
            )}
          </button>
        )}
      </div>

      {/* Toolbar - shown when focused */}
      {isFocused && (
        <div className="mt-3 flex items-center gap-4 pl-[52px]">
          {toolbarItems.map(({ icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              className="text-gray-400 transition-colors hover:text-gray-600"
              onMouseDown={(e) => e.preventDefault()}
            >
              <Icon className="h-5 w-5" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
