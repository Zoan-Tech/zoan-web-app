"use client";

import Image from "next/image";
import { useState } from "react";
import { X } from "lucide-react";
import { useInstalledAgents, useUnpairAgent } from "@/hooks/use-agents";
import { getAgentName } from "@/lib/agents";
import type { Agent } from "@/lib/agents";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const COLORS = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"];

export function PairedAgents() {
  const { data: agents, isLoading, error } = useInstalledAgents();
  const unpair = useUnpairAgent();
  const [infoAgent, setInfoAgent] = useState<Agent | null>(null);
  const [confirmAgent, setConfirmAgent] = useState<Agent | null>(null);

  if (isLoading) return <LoadingSpinner size="md" />;

  if (error || !agents?.length) return (
    <div className="px-4 pb-2 pt-4">
      <h2 className="mb-3 text-sm font-semibold text-gray-900">Paired</h2>
      <p className="text-sm text-gray-400">No paired agents</p>
    </div>
  );

  const handleConfirmUnpair = () => {
    if (!confirmAgent) return;
    unpair.mutate(
      { agentId: confirmAgent.id },
      { onSettled: () => setConfirmAgent(null) }
    );
  };

  return (
    <div className="px-4 pb-2 pt-4">
      <h2 className="mb-3 text-sm font-semibold text-gray-900">Paired</h2>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide">
        {agents.slice(0, 6).map((agent, i) => (
          <button
            key={agent.id}
            className="flex flex-col items-center gap-1.5"
            onClick={() => setInfoAgent(agent)}
          >
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded"
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

      {/* Agent info modal */}
      {infoAgent && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={() => setInfoAgent(null)}
        >
          <div
            className="mx-4 mb-6 w-full max-w-sm rounded-2xl bg-white shadow-xl sm:mb-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-5 pb-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl"
                style={{
                  backgroundColor: !infoAgent.avatar_url
                    ? COLORS[agents.indexOf(infoAgent) % COLORS.length]
                    : undefined,
                }}
              >
                {infoAgent.avatar_url ? (
                  <Image
                    src={infoAgent.avatar_url}
                    alt={getAgentName(infoAgent)}
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold text-white">
                    {getAgentName(infoAgent)[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-gray-900">{getAgentName(infoAgent)}</p>
                {infoAgent.username && (
                  <p className="truncate text-sm text-gray-400">@{infoAgent.username}</p>
                )}
              </div>
              <button
                className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"
                onClick={() => setInfoAgent(null)}
              >
                <X size={16} />
              </button>
            </div>

            {infoAgent.description && (
              <p className="px-5 pb-4 text-sm text-gray-500">{infoAgent.description}</p>
            )}

            <div className="border-t border-gray-100 p-4">
              <button
                className="w-full rounded-xl bg-red-50 py-2.5 text-sm font-medium text-red-500 hover:bg-red-100"
                onClick={() => {
                  setConfirmAgent(infoAgent);
                  setInfoAgent(null);
                }}
              >
                Unpair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unpair confirm modal */}
      {confirmAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-base font-semibold text-gray-900">Unpair agent?</h3>
            <p className="mb-6 text-sm text-gray-500">
              Are you sure you want to unpair{" "}
              <span className="font-medium text-gray-900">{getAgentName(confirmAgent)}</span>?
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setConfirmAgent(null)}
                disabled={unpair.isPending}
              >
                Cancel
              </button>
              <button
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60"
                onClick={handleConfirmUnpair}
                disabled={unpair.isPending}
              >
                {unpair.isPending ? "Unpairing…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
