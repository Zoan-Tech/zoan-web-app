"use client";

import { useTrendingAgents } from "@/hooks/use-agents";
import { AgentCard } from "./agent-card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function TrendingAgents() {
  const { data: agents, isLoading, error } = useTrendingAgents();

  if (isLoading) return <LoadingSpinner size="md" />;
  if (error || !agents?.length) return (
    <div className="px-4 pb-2 pt-4">
      <h2 className="mb-3 text-sm font-semibold text-gray-900">Paired</h2>
      <p className="text-sm text-gray-400">No trending agents</p>
    </div>
  );

  return (
    <div className="px-4 py-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">
          Trending agents
        </h2>
      </div>
      <div>
        {agents.map((agent, index) => (
          <AgentCard key={agent.id} agent={agent} index={index} />
        ))}
      </div>
    </div>
  );
}
