"use client";

import { useQuery } from "@tanstack/react-query";
import { agentService } from "@/services/agents";

export function useInstalledAgents() {
  return useQuery({
    queryKey: ["agents", "installed"],
    queryFn: () => agentService.getInstalledAgents(),
  });
}

export function useTrendingAgents() {
  return useQuery({
    queryKey: ["agents", "trending"],
    queryFn: () => agentService.getAgents(),
  });
}
