"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import { feedService } from "@/services/feed";
import { useMentionInput } from "@/hooks/use-mention-input";
import { toast } from "sonner";
import { AppShell } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { PageContent } from "@/components/ui/page-content";
import { UserAvatar } from "@/components/ui/user-avatar";
import { MentionDropdown } from "@/components/ui/mention-dropdown";
import { MentionHighlight } from "@/components/ui/mention-highlight";
import {
  CaretLeftIcon,
  ImageSquareIcon,
  SpinnerGapIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import { queryKeys } from "@/lib/query-keys";

export default function CreatePostPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error("Please write something");
      return;
    }

    setIsLoading(true);
    try {
      await feedService.createPost({
        content: content.trim(),
        visibility: "public",
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.feed.all });
      toast.success("Post created!");
      router.push("/");
    } catch (error) {
      console.error("Create post error:", error);
      toast.error("Failed to create post");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <AppShell>
      <PageHeader>
        <div className="flex w-full items-center">
          <button
            onClick={() => router.back()}
            className="absolute left-4 text-gray-600 hover:text-gray-900"
          >
            <CaretLeftIcon className="h-5 w-5" />
          </button>
          <span className="mx-auto text-base font-semibold text-gray-900">
            New post
          </span>
        </div>
      </PageHeader>

      <PageContent className="flex min-h-[calc(100vh-56px)] flex-col">
        {/* Text area */}
        <div className="relative flex flex-1 gap-3 p-4">
          <UserAvatar user={user} size="md" />
          <div className="relative flex-1">
            <MentionHighlight
              content={content}
              placeholder="What's happening?"
              className="min-h-[1.25rem] whitespace-pre-wrap break-words text-sm leading-[1.5] text-gray-900"
            />
            <textarea
              ref={(el) => {
                (inputRef as React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>).current = el;
              }}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                handleKeyDown(e);
              }}
              className="absolute inset-0 h-full w-full resize-none border-0 bg-transparent p-0 text-sm leading-[1.5] text-transparent caret-gray-900 focus:outline-none focus:ring-0"
              autoFocus
              disabled={isLoading}
            />
            <MentionDropdown
              results={mentionResults}
              selectedIndex={selectedIndex}
              onSelect={selectMention}
              visible={showMentions}
            />
          </div>
        </div>

        {/* Bottom toolbar */}
        <div className="sticky bottom-0 flex items-center gap-3 border-t border-gray-100 bg-white px-4 py-3">
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600"
          >
            <ImageSquareIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600"
          >
            <Image src="/logo-draw.svg" alt="Logo" width={20} height={20} />
          </button>

          {/* TODO: Stack Thesi */}
          <div className="ml-auto flex items-center gap-1 text-sm text-gray-400" />

          <button
            onClick={handleSubmit}
            disabled={isLoading || !content.trim()}
            className="rounded-full bg-[#27CEC5] px-5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#20b5ad] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <SpinnerGapIcon className="h-4 w-4 animate-spin" />
            ) : (
              "Post"
            )}
          </button>
        </div>
      </PageContent>
    </AppShell>
  );
}
