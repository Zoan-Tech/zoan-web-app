"use client";

import { useState, useEffect } from "react";
import { feedService } from "@/services/feed";
import { useAuthStore } from "@/stores/auth";
import { CreatePollRequest, Mention } from "@/types/feed";
import { renderContentWithMentions } from "@/lib/render-mentions";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { UserAvatar } from "@/components/ui/user-avatar";
import { MentionDropdown } from "@/components/ui/mention-dropdown";
import { MentionHighlight } from "@/components/ui/mention-highlight";
import { PollCreator } from "@/components/ui/poll-creator";
import { PostToolbar } from "@/components/ui/post-toolbar";
import { ImagePreviewModal } from "@/components/ui/image-preview-modal";
import { useMentionInput } from "@/hooks/use-mention-input";
import { formatRelativeTime } from "@/lib/utils";
import { Agent } from "@/lib/agents";
import { SpinnerGapIcon, XIcon } from "@phosphor-icons/react";
import Image from "next/image";

const MAX_FILES = 4;

interface QuoteTarget {
  id: string;
  content: string;
  user: { display_name?: string; username?: string };
  created_at: string;
  mentions?: Mention[];
  entities?: { mentions?: Mention[] };
}

interface QuotePostModalProps {
  onClose: () => void;
  post: QuoteTarget;
  repostPostId?: string;
  repostCommentId?: string;
  onSuccess: () => void;
}

export function QuotePostModal({ onClose, post, repostPostId, repostCommentId, onSuccess }: QuotePostModalProps) {
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
        ...(repostCommentId
          ? { repost_comment_id: repostCommentId }
          : { repost_post_id: repostPostId ?? post.id }),
      });
      toast.success("Quoted!");
      onSuccess();
      onClose();
    } catch {
      toast.error("Failed to quote post");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Modal open onClose={onClose} title="Quote" maxWidth="sm:max-w-lg">
        <div className="-mx-6 -mt-6">
          {/* Compose area */}
          <div className="flex gap-3 px-6 pt-4 pb-3">
            <UserAvatar user={user} size="md" />
            <div className="relative flex-1">
              <MentionHighlight
                content={content}
                placeholder="Add a comment..."
                className="min-h-15 whitespace-pre-wrap wrap-break-word text-sm leading-normal text-gray-900"
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
                placeholder="Add a comment..."
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
            <div className="flex gap-2 overflow-x-auto px-6 pb-2">
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
                    onClick={() => setMediaFiles((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-white"
                  >
                    <XIcon className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Poll creator */}
          {showPoll && (
            <PollCreator
              onChange={setPoll}
              onRemove={() => { setShowPoll(false); setPoll(null); }}
            />
          )}

          {/* Quoted post preview */}
          <div className="mx-6 mb-3 max-h-40 overflow-y-auto rounded-xl border border-gray-200 p-3">
            <div className="mb-1 flex items-center gap-1.5">
              <span className="text-xs font-semibold text-gray-900">
                {post.user.display_name ?? post.user.username}
              </span>
              {post.user.username && (
                <span className="text-xs text-gray-400">@{post.user.username}</span>
              )}
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400">
                {formatRelativeTime(post.created_at)}
              </span>
            </div>
            <div className="text-xs text-gray-600 [&_p]:mb-1 [&_p:last-child]:mb-0">
              {renderContentWithMentions(post.content, post.mentions ?? post.entities?.mentions)}
            </div>
          </div>

          {/* Toolbar + submit */}
          <div className="flex items-center border-t border-gray-100 px-6 py-3">
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
        </div>
      </Modal>
      <ImagePreviewModal src={previewSrc} onClose={() => setPreviewSrc(null)} />
    </>
  );
}
