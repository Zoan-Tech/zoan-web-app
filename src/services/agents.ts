import { api } from "@/lib/api";
import type { Agent } from "@/lib/agents";
import type { PairingState, PairingStep } from "@/lib/pairing";

export const agentService = {
  async getAgents(): Promise<Agent[]> {
    const response = await api.get("/agents");
    return response.data.data?.agents ?? response.data.data ?? [];
  },

  async getInstalledAgents(): Promise<Agent[]> {
    const response = await api.get("/agents/installed");
    return response.data.data?.agents ?? response.data.data ?? [];
  },

  async getPairingState(agentId: string): Promise<PairingState> {
    const response = await api.get(`/pairing/${agentId}`);
    return response.data.data;
  },

  async submitPairingStep(
    agentId: string,
    step: PairingStep
  ): Promise<PairingState> {
    const response = await api.post("/pairing/step", {
      agent_id: agentId,
      step,
    });
    return response.data.data;
  },
};
