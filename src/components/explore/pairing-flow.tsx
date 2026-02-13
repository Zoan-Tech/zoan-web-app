"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PairingState, SignalType, isComplete } from "@/lib/pairing";
import { ConsentStep } from "./steps/consent-step";
import { TransactionStep } from "./steps/transaction-step";
import { SignatureStep } from "./steps/signature-step";
import { ApiCallStep } from "./steps/api-call-step";
import { AppShell } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { PageContent } from "@/components/ui/page-content";
import { CheckCircleIcon, CaretLeftIcon } from "@phosphor-icons/react";

interface Props {
  agentId: string;
  pairingState: PairingState;
  onComplete: () => void;
}

export function PairingFlow({ agentId, pairingState, onComplete }: Props) {
  const router = useRouter();

  const complete = isComplete(pairingState);

  useEffect(() => {
    if (!complete) return;
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [complete, onComplete]);

  if (complete) {
    return (
      <AppShell>
        <PageHeader title="KYA" />
        <PageContent>
          <div className="flex flex-col items-center pt-20">
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
            <p className="mt-4 text-xs text-gray-400">
              Redirecting to Explore...
            </p>
          </div>
        </PageContent>
      </AppShell>
    );
  }

  const step = pairingState.current_step;
  if (!step) return null;

  const stepNumber = step.step_id;
  const totalSteps = pairingState.total_steps;

  const getTitle = () => {
    switch (step.signal_type) {
      case SignalType.Consent:
        return "KYA";
      case SignalType.Transaction:
        return "Transaction";
      case SignalType.SignatureRequest:
        return "Signature";
      case SignalType.ApiCall:
        return "API Call";
      default:
        return "Pairing";
    }
  };

  return (
    <AppShell>
      <PageHeader>
        <div className="relative flex w-full items-center">
          <button
            onClick={() => router.back()}
            className="absolute left-0 p-1 text-gray-600 hover:text-gray-900"
          >
            <CaretLeftIcon className="h-4 w-4" weight="bold" />
          </button>
          <span className="mx-auto text-sm font-medium text-gray-900">
            {getTitle()}
          </span>
        </div>
      </PageHeader>

      <PageContent className="flex flex-col">
        {step.signal_type === SignalType.Consent && (
          <ConsentStep agentId={agentId} step={step} stepNumber={stepNumber} totalSteps={totalSteps} />
        )}
        {step.signal_type === SignalType.Transaction && (
          <TransactionStep agentId={agentId} step={step} stepNumber={stepNumber} totalSteps={totalSteps} />
        )}
        {step.signal_type === SignalType.SignatureRequest && (
          <SignatureStep agentId={agentId} step={step} stepNumber={stepNumber} totalSteps={totalSteps} />
        )}
        {step.signal_type === SignalType.ApiCall && (
          <ApiCallStep agentId={agentId} step={step} stepNumber={stepNumber} totalSteps={totalSteps} />
        )}
      </PageContent>
    </AppShell>
  );
}
