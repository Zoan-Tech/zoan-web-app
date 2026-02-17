"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { agentService } from "@/services/agents";
import type { PairingStep } from "@/lib/pairing";

export function usePairingState(agentId: string) {
  return useQuery({
    queryKey: ["pairing", agentId],
    queryFn: () => agentService.getPairingState(agentId),
    enabled: !!agentId,
  });
}

export function useSubmitStep(agentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (step: PairingStep) =>
      agentService.submitPairingStep(agentId, step),
    onSuccess: (newState) => {
      queryClient.setQueryData(["pairing", agentId], newState);
    },
  });
}
