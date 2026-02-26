"use client";

import { useState, useEffect } from "react";
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
import { PostToolbar } from "@/components/ui/post-toolbar";
import { CaretLeftIcon, SpinnerGapIcon, XIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { ImagePreviewModal } from "@/components/ui/image-preview-modal";
import { PollCreator } from "@/components/ui/poll-creator";
import { queryKeys } from "@/lib/query-keys";
import { CreatePollRequest } from "@/types/feed";
import { Agent } from "@/lib/agents";

const MAX_FILES = 4;

export default function CreatePostPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [showPoll, setShowPoll] = useState(false);
  const [poll, setPoll] = useState<CreatePollRequest | null>(null);

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

  useEffect(() => {
    const urls = mediaFiles.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [mediaFiles]);

  const handleRemoveFile = (index: number) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const images = Array.from(e.clipboardData.items)
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter((f): f is File => f !== null);
    if (!images.length) return;
    e.preventDefault();
    setMediaFiles((prev) => [...prev, ...images].slice(0, MAX_FILES));
  };

  const insertEmoji = (emoji: string) => {
    const el = inputRef.current;
    const pos = el?.selectionStart ?? content.length;
    const newContent = content.slice(0, pos) + emoji + content.slice(pos);
    setContent(newContent);
    requestAnimationFrame(() => {
      if (el) el.setSelectionRange(pos + emoji.length, pos + emoji.length);
    });
  };

  const mentionAgent = (agent: Agent) => {
    const handle = agent.username || agent.name || agent.display_name || agent.id;
    const el = inputRef.current;
    const pos = el?.selectionStart ?? content.length;
    const mention = `@${handle} `;
    setContent(content.slice(0, pos) + mention + content.slice(pos));
    requestAnimationFrame(() => {
      if (el) {
        const newPos = pos + mention.length;
        el.focus();
        el.setSelectionRange(newPos, newPos);
      }
    });
  };

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
        medias: mediaFiles.length > 0 ? mediaFiles : undefined,
        poll: poll ?? undefined,
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
          <span className="mx-auto font-medium text-sm text-gray-900">
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
              className="min-h-5 whitespace-pre-wrap wrap-break-word text-sm leading-normal text-gray-900"
            />
            <textarea
              ref={(el) => {
                (inputRef as React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>).current = el;
              }}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleSubmit();
                  return;
                }
                handleKeyDown(e);
              }}
              onPaste={handlePaste}
              className="absolute inset-0 h-full w-full resize-none border-0 bg-transparent p-0 text-sm leading-normal text-transparent caret-gray-900 focus:outline-none focus:ring-0"
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

        {/* Media previews */}
        {previews.length > 0 && (
          <div className="flex gap-2 overflow-x-auto px-4 pb-2">
            {previews.map((src, i) => (
              <div key={i} className="relative shrink-0">
                <Image
                  src={src}
                  alt={`preview-${i}`}
                  width={80}
                  height={80}
                  className="h-20 w-20 cursor-pointer rounded-lg object-cover"
                  unoptimized
                  onClick={() => setPreviewSrc(src)}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveFile(i)}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-white"
                >
                  <XIcon className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <ImagePreviewModal src={previewSrc} onClose={() => setPreviewSrc(null)} />

        {/* Poll creator */}
        {showPoll && (
          <PollCreator
            onChange={setPoll}
            onRemove={() => { setShowPoll(false); setPoll(null); }}
          />
        )}

        {/* Bottom toolbar */}
        <div className="sticky bottom-0 flex items-center border-t border-gray-100 bg-white px-4 py-3">
          <PostToolbar
            onFilesSelected={(files) => setMediaFiles((prev) => [...prev, ...files].slice(0, MAX_FILES))}
            imageDisabled={mediaFiles.length >= MAX_FILES}
            onAgentMention={mentionAgent}
            showPoll={showPoll}
            onPollToggle={() => { setShowPoll((v) => !v); if (showPoll) setPoll(null); }}
            onEmojiSelect={insertEmoji}
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading || !content.trim()}
            className="ml-auto rounded-full bg-[#27CEC5] px-5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#20b5ad] disabled:cursor-not-allowed disabled:opacity-50"
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
