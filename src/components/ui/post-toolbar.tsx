"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { ImageSquareIcon, ChartBarIcon } from "@phosphor-icons/react";
import { EmojiPickerButton } from "@/components/ui/emoji-picker-button";
import { useTrendingAgents } from "@/hooks/use-agents";
import { Agent, getAgentName } from "@/lib/agents";

const AGENT_COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"];

interface PostToolbarProps {
  onFilesSelected: (files: File[]) => void;
  imageDisabled?: boolean;
  onAgentMention: (agent: Agent) => void;
  showPoll: boolean;
  onPollToggle: () => void;
  onEmojiSelect: (emoji: string) => void;
  className?: string;
}

export function PostToolbar({
  onFilesSelected,
  imageDisabled,
  onAgentMention,
  showPoll,
  onPollToggle,
  onEmojiSelect,
  className,
}: PostToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const agentsDropdownRef = useRef<HTMLDivElement>(null);
  const [showAgents, setShowAgents] = useState(false);
  const { data: trendingAgents, isLoading: agentsLoading } = useTrendingAgents();

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
    const files = Array.from(e.target.files ?? []);
    if (files.length) onFilesSelected(files);
    e.target.value = "";
  };

  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Image */}
      <button
        type="button"
        className="text-gray-400 transition-colors hover:text-gray-600 disabled:opacity-40"
        disabled={imageDisabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
      >
        <ImageSquareIcon className="h-5 w-5" />
      </button>

      {/* Agents */}
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
                  onClick={() => { onAgentMention(agent); setShowAgents(false); }}
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

      {/* Poll */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onPollToggle}
        className={showPoll ? "text-[#27CEC5]" : "text-gray-400 transition-colors hover:text-gray-600"}
      >
        <ChartBarIcon className="h-5 w-5" />
      </button>

      {/* Emoji */}
      <EmojiPickerButton onEmojiSelect={onEmojiSelect} />
    </div>
  );
}
