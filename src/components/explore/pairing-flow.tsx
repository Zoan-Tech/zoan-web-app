"use client";

import { PairingState, SignalType, isComplete, getProgress } from "@/lib/pairing";
import { ConsentStep } from "./steps/consent-step";
import { TransactionStep } from "./steps/transaction-step";
import { SignatureStep } from "./steps/signature-step";
import { ApiCallStep } from "./steps/api-call-step";
import { CheckCircleIcon } from "@phosphor-icons/react";

interface Props {
  agentId: string;
  pairingState: PairingState;
  onComplete: () => void;
}

export function PairingFlow({ agentId, pairingState, onComplete }: Props) {
  const progress = getProgress(pairingState);

  if (isComplete(pairingState)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <CheckCircleIcon
          size={64}
          weight="fill"
          className="text-[#27CEC5]"
        />
        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          Pairing Complete!
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Your agent is now ready to use.
        </p>
        <button
          onClick={onComplete}
          className="mt-6 w-full max-w-sm rounded-xl bg-[#27CEC5] py-3 font-semibold text-white transition-colors hover:bg-[#20b5ad]"
        >
          Done
        </button>
      </div>
    );
  }

  const step = pairingState.current_step;
  if (!step) return null;

  const stepNumber = step.step_id;
  const totalSteps = pairingState.total_steps;

  return (
    <div className="min-h-screen bg-white">
      {/* Progress bar */}
      <div className="sticky top-0 z-10 bg-white px-4 pt-3">
        <div className="h-1 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-[#27CEC5] transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Step {stepNumber} of {totalSteps}
        </p>
      </div>

      {/* Step content */}
      {step.signal_type === SignalType.Consent && (
        <ConsentStep agentId={agentId} step={step} />
      )}
      {step.signal_type === SignalType.Transaction && (
        <TransactionStep agentId={agentId} step={step} />
      )}
      {step.signal_type === SignalType.SignatureRequest && (
        <SignatureStep agentId={agentId} step={step} />
      )}
      {step.signal_type === SignalType.ApiCall && (
        <ApiCallStep agentId={agentId} step={step} />
      )}
    </div>
  );
}
