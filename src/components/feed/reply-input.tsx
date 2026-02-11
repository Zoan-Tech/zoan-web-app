"use client";

import { useState } from "react";
import { feedService } from "@/services/feed";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useAuthStore } from "@/stores/auth";
import { toast } from "sonner";

export function ReplyInput({
  postId,
  parentId,
  onReplyCreated,
  inputRef,
}: {
  postId: string;
  parentId?: string;
  onReplyCreated: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const { user } = useAuthStore();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return null;

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await feedService.createComment({
        post_id: postId,
        parent_id: parentId,
        content: trimmed,
      });
      setContent("");
      onReplyCreated();
    } catch {
      toast.error("Failed to post reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center gap-3 border-b border-[#E1F1F0] px-4 py-3">
      <UserAvatar user={user} size="md" />
      <input
        ref={inputRef}
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
          }
        }}
        placeholder="Reply or @"
        className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none"
      />
      <button
        onClick={handleSubmit}
        disabled={!content.trim() || isSubmitting}
        className="rounded-full bg-[#27CEC5] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#20b5ad] disabled:opacity-50"
      >
        Reply
      </button>
    </div>
  );
}
