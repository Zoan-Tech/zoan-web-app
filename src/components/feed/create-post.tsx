"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/auth";
import { feedService } from "@/services/feed";
import { toast } from "sonner";
import { UserAvatar } from "@/components/ui/user-avatar";
import { IconButton } from "@/components/ui/icon-button";
import {
  ImageSquareIcon,
  SpinnerGapIcon,
  GlobeIcon,
  UsersIcon,
  AtIcon,
} from "@phosphor-icons/react";
import { Post } from "@/types/feed";

interface Props {
  onPostCreated?: (post: Post) => void;
}

export function CreatePost({ onPostCreated }: Props) {
  const { user } = useAuthStore();
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [visibility] = useState<"public" | "followers" | "mentioned">("public");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error("Please write something");
      return;
    }

    setIsLoading(true);
    try {
      const post = await feedService.createPost({
        content: content.trim(),
        visibility,
      });
      setContent("");
      toast.success("Post created!");
      onPostCreated?.(post);
    } catch (error) {
      console.error("Create post error:", error);
      toast.error("Failed to create post");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="border-b border-gray-100 bg-white px-4 py-4">
      <div className="flex gap-3">
        <UserAvatar user={user} size="md" />

        <form onSubmit={handleSubmit} className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening?"
            maxLength={280}
            rows={3}
            className="w-full resize-none border-0 bg-transparent text-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
            disabled={isLoading}
          />

          <div className="flex items-center justify-between border-t border-gray-100 pt-3">
            <div className="flex items-center gap-2">
              <IconButton type="button" variant="accent">
                <ImageSquareIcon className="h-5 w-5" />
              </IconButton>

              {/* Visibility selector */}
              <div className="flex items-center gap-1 rounded-full bg-[#E0FAF8] px-2 py-1 text-xs text-[#27CEC5]">
                {visibility === "public" && <GlobeIcon className="h-3 w-3" />}
                {visibility === "followers" && <UsersIcon className="h-3 w-3" />}
                {visibility === "mentioned" && <AtIcon className="h-3 w-3" />}
                <span className="capitalize">{visibility}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`text-sm ${
                  content.length > 260 ? "text-red-500" : "text-gray-400"
                }`}
              >
                {content.length}/280
              </span>
              <button
                type="submit"
                disabled={isLoading || !content.trim()}
                className="rounded-full bg-[#27CEC5] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#20b5ad] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <SpinnerGapIcon className="h-4 w-4 animate-spin" />
                ) : (
                  "Post"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
