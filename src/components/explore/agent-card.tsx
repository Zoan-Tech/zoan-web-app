"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Agent, getAgentName, needsPairing } from "@/lib/agents";
import { cn } from "@/lib/utils";

interface Props {
  agent: Agent;
  index: number;
}

const COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"];

export function AgentCard({ agent, index }: Props) {
  const router = useRouter();

  const handlePair = () => {
    router.push(`/explore/pairing/${agent.id}`);
  };

  return (
    <div className="flex items-center gap-3 py-3">
      {/* Avatar */}
      <div
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded"
        )}
        style={{
          backgroundColor: !agent.avatar_url
            ? COLORS[index % COLORS.length]
            : undefined,
        }}
      >
        {agent.avatar_url ? (
          <Image
            src={agent.avatar_url}
            alt={getAgentName(agent)}
            width={48}
            height={48}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-lg font-bold text-white">
            {getAgentName(agent)[0].toUpperCase()}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-gray-900">
          {getAgentName(agent)}
        </h3>
        <p className="truncate text-xs text-gray-500">
          {agent.description || agent.type}
        </p>
      </div>

      {/* Pair Button */}
      {needsPairing(agent) && (
        <button
          onClick={handlePair}
          className="shrink-0 rounded-full bg-[#27CEC5] px-5 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[#20b5ad]"
        >
          Pair
        </button>
      )}
    </div>
  );
}
