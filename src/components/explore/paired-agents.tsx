"use client";

import Image from "next/image";
import { useInstalledAgents } from "@/hooks/useAgents";
import { getAgentName } from "@/lib/agents";

const COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"];

export function PairedAgents() {
  const { data: agents, isLoading } = useInstalledAgents();

  if (isLoading || !agents?.length) return null;

  return (
    <div className="px-4 pb-2 pt-4">
      <h2 className="mb-3 text-sm font-semibold text-gray-900">Paired</h2>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide">
        {agents.slice(0, 6).map((agent, i) => (
          <button
            key={agent.id}
            className="flex flex-col items-center gap-1.5"
          >
            <div
              className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded"
              style={{
                backgroundColor: !agent.avatar_url
                  ? COLORS[i % COLORS.length]
                  : undefined,
              }}
            >
              {agent.avatar_url ? (
                <Image
                  src={agent.avatar_url}
                  alt={getAgentName(agent)}
                  width={56}
                  height={56}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-lg font-bold text-white">
                  {getAgentName(agent)[0].toUpperCase()}
                </span>
              )}
            </div>
            <span className="w-16 truncate text-center text-[11px] text-gray-600">
              {getAgentName(agent)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
