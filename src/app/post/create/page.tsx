"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth";
import { feedService } from "@/services/feed";
import { useMentionInput } from "@/hooks/use-mention-input";
import { useTrendingAgents } from "@/hooks/use-agents";
import { toast } from "sonner";
import { AppShell } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { PageContent } from "@/components/ui/page-content";
import { UserAvatar } from "@/components/ui/user-avatar";
import { MentionDropdown } from "@/components/ui/mention-dropdown";
import { MentionHighlight } from "@/components/ui/mention-highlight";
import {
  CaretLeftIcon,
  ChartBarIcon,
  ImageSquareIcon,
  SpinnerGapIcon,
  XIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import { ImagePreviewModal } from "@/components/ui/image-preview-modal";
import { PollCreator } from "@/components/ui/poll-creator";
import { EmojiPickerButton } from "@/components/ui/emoji-picker-button";
import { queryKeys } from "@/lib/query-keys";
import { CreatePollRequest } from "@/types/feed";
import { Agent, getAgentName } from "@/lib/agents";

const MAX_FILES = 4;
const AGENT_COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"];

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
  const [showAgents, setShowAgents] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const agentsDropdownRef = useRef<HTMLDivElement>(null);

  const { data: trendingAgents, isLoading: agentsLoading } = useTrendingAgents();

  useEffect(() => {
    const urls = mediaFiles.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [mediaFiles]);

  useEffect(() => {
    if (!showAgents) return;
    function handleClickOutside(e: MouseEvent) {
      if (agentsDropdownRef.current && !agentsDropdownRef.current.contains(e.target as Node)) {
        setShowAgents(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAgents]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;
    setMediaFiles((prev) => {
      const combined = [...prev, ...selected];
      return combined.slice(0, MAX_FILES);
    });
    // reset input so the same file can be re-selected after removal
    e.target.value = "";
  };

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

  const insertEmoji = (emoji: string) => {
    const el = inputRef.current;
    const pos = el?.selectionStart ?? content.length;
    const newContent = content.slice(0, pos) + emoji + content.slice(pos);
    setContent(newContent);
    requestAnimationFrame(() => {
      if (el) {
        el.setSelectionRange(pos + emoji.length, pos + emoji.length);
      }
    });
  };

  const mentionAgent = (agent: Agent) => {
    const handle = agent.username || agent.name || agent.display_name || agent.id;
    const el = inputRef.current;
    const pos = el?.selectionStart ?? content.length;
    const mention = `@${handle} `;
    const newContent = content.slice(0, pos) + mention + content.slice(pos);
    setContent(newContent);
    setShowAgents(false);
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
        <div className="sticky bottom-0 flex items-center gap-3 border-t border-gray-100 bg-white px-4 py-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600 disabled:opacity-40"
            disabled={mediaFiles.length >= MAX_FILES}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageSquareIcon className="h-5 w-5" />
          </button>

          {/* Agents dropdown */}
          <div className="relative flex items-center" ref={agentsDropdownRef}>
            <button
              type="button"
              className={showAgents ? "text-[#27CEC5]" : "text-gray-400 hover:text-gray-600"}
              onClick={() => setShowAgents((v) => !v)}
            >
              <Image src="/logo-draw.svg" alt="Logo" width={20} height={20} />
            </button>

            {showAgents && (
              <div className="absolute bottom-full left-0 z-50 mb-2 w-64 rounded-xl border border-gray-100 bg-white shadow-lg">
                <p className="border-b border-gray-100 px-3 py-2 text-xs font-semibold text-gray-500">
                  Trending Agents
                </p>
                <div className="max-h-72 overflow-y-auto">
                  {agentsLoading && (
                    <p className="px-3 py-3 text-sm text-gray-400">Loading…</p>
                  )}
                  {!agentsLoading && !trendingAgents?.length && (
                    <p className="px-3 py-3 text-sm text-gray-400">No agents found</p>
                  )}
                  {trendingAgents?.map((agent, index) => (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => mentionAgent(agent)}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-gray-50"
                    >
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded"
                        style={{
                          backgroundColor: !agent.avatar_url
                            ? AGENT_COLORS[index % AGENT_COLORS.length]
                            : undefined,
                        }}
                      >
                        {agent.avatar_url ? (
                          <Image
                            src={agent.avatar_url}
                            alt={getAgentName(agent)}
                            width={32}
                            height={32}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-bold text-white">
                            {getAgentName(agent)[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {getAgentName(agent)}
                        </p>
                        {(agent.description || agent.username) && (
                          <p className="truncate text-xs text-gray-400">
                            {agent.description || `@${agent.username}`}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => { setShowPoll((v) => !v); if (showPoll) setPoll(null); }}
            className={showPoll ? "text-[#27CEC5]" : "text-gray-400 hover:text-gray-600"}
          >
            <ChartBarIcon className="h-5 w-5" />
          </button>
          <EmojiPickerButton onEmojiSelect={insertEmoji} />

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
