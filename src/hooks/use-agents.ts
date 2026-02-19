"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

export function useUnpairAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId }: { agentId: string }) =>
      agentService.unpairAgent(agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents", "installed"] });
      queryClient.invalidateQueries({ queryKey: ["agents", "trending"] });
    },
  });
}
