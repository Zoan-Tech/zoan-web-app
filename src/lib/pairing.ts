export enum SignalType {
  Consent = "consent",
  Transaction = "transaction",
  ApiCall = "api_call",
  Message = "message",
  SignatureRequest = "signature_request",
  PrivyDelegation = "privy_delegation",
  Complete = "complete",
}

export type PostProcessingType = "api_call" | "transaction" | "skip_next";

export interface PostProcessing {
  type: PostProcessingType;
  format?: string;
  config?: Record<string, unknown>;
}

export interface PairingStep {
  step_id: number;
  action: string;
  signal_type: SignalType;
  payload?: Record<string, unknown>;
  post_processing?: PostProcessing;
  response?: Record<string, unknown>;
}

export interface PairingState {
  agent_id: string;
  current_step: PairingStep | null;
  total_steps: number;
  completed_steps: PairingStep[];
  status: "processing" | "done" | "failed";
}

export interface TransactionPayload {
  transaction: {
    to: string;
    data: string;
    value: string;
    chainId: number;
    metadata?: {
      action?: string;
      function?: {
        name: string;
        inputs: Array<{
          name: string;
          type: string;
          value: string;
        }>;
      };
    };
  };
}

export interface EIP712Payload {
  format: "eip712";
  domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
  };
  primaryType: string;
  types: Record<string, unknown>;
  message: Record<string, unknown>;
}

export interface ApiCallPayload {
  method: "GET" | "POST" | "PUT" | "DELETE";
  endpoint: string;
  body?: Record<string, unknown>;
}

export const getProgress = (state: PairingState): number =>
  state.total_steps > 0 ? (state.completed_steps?.length ?? 0) / state.total_steps : 0;

export const isComplete = (state: PairingState): boolean =>
  state.current_step === null && (state.completed_steps?.length ?? 0) > 0;
