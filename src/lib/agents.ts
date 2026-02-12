export type AgentType = "primary" | "trading";

export interface Agent {
  id: string;
  name?: string;
  username?: string;
  display_name?: string;
  description?: string;
  instruction?: string;
  model: string;
  model_kwargs?: Record<string, unknown>;
  type: AgentType;
  paired?: boolean;
  avatar_url?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export const getAgentName = (agent: Agent): string =>
  agent.display_name || agent.name || agent.username || "Unnamed Agent";

export const isBuiltByZoan = (agent: Agent): boolean =>
  agent.type === "primary";

export const needsPairing = (agent: Agent): boolean =>
  agent.type === "trading" && !agent.paired;
