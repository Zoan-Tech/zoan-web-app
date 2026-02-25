"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { feedService } from "@/services/feed";
import { Comment, CreatePollRequest } from "@/types/feed";
import { UserAvatar } from "@/components/ui/user-avatar";
import { MentionDropdown } from "@/components/ui/mention-dropdown";
import { MentionHighlight } from "@/components/ui/mention-highlight";
import { useAuthStore } from "@/stores/auth";
import { useMentionInput } from "@/hooks/use-mention-input";
import { useTrendingAgents } from "@/hooks/use-agents";
import { Agent, getAgentName } from "@/lib/agents";
import { toast } from "sonner";
import {
  ChartBarIcon,
  ImageSquareIcon,
  SpinnerGapIcon,
  XIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import { ImagePreviewModal } from "@/components/ui/image-preview-modal";
import { PollCreator } from "@/components/ui/poll-creator";
import { EmojiPickerButton } from "@/components/ui/emoji-picker-button";

const AGENT_COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"];

const MAX_FILES = 4;

export function ReplyInput({
  postId,
  parentId,
  onReplyCreated,
  inputRef: externalInputRef,
}: {
  postId: string;
  parentId?: string;
  onReplyCreated: (comment: Comment) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [showPoll, setShowPoll] = useState(false);
  const [poll, setPoll] = useState<CreatePollRequest | null>(null);
  const [showAgents, setShowAgents] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const agentsDropdownRef = useRef<HTMLDivElement>(null);

  const { data: trendingAgents, isLoading: agentsLoading } = useTrendingAgents();

  useEffect(() => {
    const urls = mediaFiles.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [mediaFiles]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;
    setMediaFiles((prev) => [...prev, ...selected].slice(0, MAX_FILES));
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

  useEffect(() => {
    if (!showAgents) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (agentsDropdownRef.current && !agentsDropdownRef.current.contains(e.target as Node)) {
        setShowAgents(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAgents]);

  if (!user) return null;

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const newComment = await feedService.createComment({
        post_id: postId,
        parent_comment_id: parentId,
        content: trimmed,
        medias: mediaFiles.length > 0 ? mediaFiles : undefined,
        poll: poll ?? undefined,
      });
      setContent("");
      setMediaFiles([]);
      setShowPoll(false);
      setPoll(null);
      setIsFocused(false);
      toast.success("Comment posted!");
      onReplyCreated(newComment);
    } catch {
      toast.error("Failed to post reply");
    } finally {
      setIsSubmitting(false);
    }
  };

  const mentionAgent = (agent: Agent) => {
    const handle = agent.username || agent.name || agent.display_name || agent.id;
    const el = inputRef.current;
    const pos = el?.selectionStart ?? content.length;
    const mention = `@${handle} `;
    setContent(content.slice(0, pos) + mention + content.slice(pos));
    setShowAgents(false);
    requestAnimationFrame(() => {
      if (el) {
        const newPos = pos + mention.length;
        el.focus();
        el.setSelectionRange(newPos, newPos);
      }
    });
  };

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

  return (
    <div ref={containerRef} className="border-b border-[#E1F1F0] px-4 py-3">
      <div className="flex items-center gap-3">
        <UserAvatar user={user} size="md" />
        <div className="relative flex-1">
          <MentionHighlight
            content={content}
            placeholder="Reply or @"
            className="min-h-5 whitespace-nowrap text-sm leading-normal text-gray-900"
          />
          <input
            ref={setRef}
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onPaste={handlePaste}
            onKeyDown={(e) => {
              if (handleKeyDown(e)) return;
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            className="absolute inset-0 w-full bg-transparent p-0 text-sm leading-normal text-transparent caret-gray-900 outline-none"
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
            className="shrink-0 rounded-full bg-[#27CEC5] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#20b5ad] disabled:opacity-50"
          >
            {isSubmitting ? (
              <SpinnerGapIcon className="h-4 w-4 animate-spin" />
            ) : (
              "Reply"
            )}
          </button>
        )}
      </div>

      {/* Toolbar + previews - shown when focused */}
      {isFocused && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="mt-3 flex items-center gap-4 pl-13">
            <button
              type="button"
              className="text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40"
              disabled={mediaFiles.length >= MAX_FILES}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageSquareIcon className="h-5 w-5" />
            </button>

            {/* Agents dropdown */}
            <div className="relative flex items-center" ref={agentsDropdownRef}>
              <button
                type="button"
                className={showAgents ? "text-[#27CEC5]" : "text-gray-400 transition-colors hover:text-gray-600"}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowAgents((v) => !v)}
              >
                <Image src="/logo-draw.svg" alt="Agents" width={20} height={20} />
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
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => mentionAgent(agent)}
                        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-gray-50"
                      >
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded"
                          style={{ backgroundColor: !agent.avatar_url ? AGENT_COLORS[index % AGENT_COLORS.length] : undefined }}
                        >
                          {agent.avatar_url ? (
                            <Image src={agent.avatar_url} alt={getAgentName(agent)} width={32} height={32} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-white">{getAgentName(agent)[0].toUpperCase()}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">{getAgentName(agent)}</p>
                          {(agent.description || agent.username) && (
                            <p className="truncate text-xs text-gray-400">{agent.description || `@${agent.username}`}</p>
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
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { setShowPoll((v) => !v); if (showPoll) setPoll(null); }}
              className={showPoll ? "text-[#27CEC5]" : "text-gray-400 transition-colors hover:text-gray-600"}
            >
              <ChartBarIcon className="h-5 w-5" />
            </button>
            <EmojiPickerButton onEmojiSelect={insertEmoji} />
          </div>
          {showPoll && (
            <div className="mt-2">
              <PollCreator
                onChange={setPoll}
                onRemove={() => { setShowPoll(false); setPoll(null); }}
              />
            </div>
          )}
          {previews.length > 0 && (
            <div className="mt-2 flex gap-2 overflow-x-auto pl-13">
              {previews.map((src, i) => (
                <div key={i} className="relative shrink-0">
                  <Image
                    src={src}
                    alt={`preview-${i}`}
                    width={64}
                    height={64}
                    className="h-16 w-16 cursor-pointer rounded-lg object-cover"
                    unoptimized
                    onClick={() => setPreviewSrc(src)}
                  />
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleRemoveFile(i)}
                    className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-800 text-white"
                  >
                    <XIcon className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      <ImagePreviewModal src={previewSrc} onClose={() => setPreviewSrc(null)} />
    </div>
  );
}
