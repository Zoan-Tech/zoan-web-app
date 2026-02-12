"use client";

import { useSubmitStep } from "@/hooks/usePairing";
import { PairingStep } from "@/lib/pairing";
import { ShieldCheckIcon, LockKeyIcon } from "@phosphor-icons/react";

interface Props {
  agentId: string;
  step: PairingStep;
}

export function ConsentStep({ agentId, step }: Props) {
  const { mutate: submitStep, isPending } = useSubmitStep(agentId);

  const handleAgree = () => {
    submitStep({
      ...step,
      response: { consented: true },
    });
  };

  return (
    <div className="px-6 py-8">
      <h1 className="text-xl font-bold text-gray-900">Know Your Agent (KYA)</h1>
      <p className="mt-1 text-sm text-gray-500">{step.action}</p>

      <div className="mt-8 space-y-6">
        <div className="flex gap-3">
          <ShieldCheckIcon
            size={24}
            weight="fill"
            className="mt-0.5 flex-shrink-0 text-[#27CEC5]"
          />
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Know Your Agent
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              This agent will have access to perform actions on your behalf as
              configured during setup.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <LockKeyIcon
            size={24}
            weight="fill"
            className="mt-0.5 flex-shrink-0 text-[#27CEC5]"
          />
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Privacy & Data
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Your data will be used only for the agent&apos;s intended purpose
              and not shared with third parties.
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={handleAgree}
        disabled={isPending}
        className="mt-10 w-full rounded-xl bg-[#27CEC5] py-3.5 font-semibold text-white transition-colors hover:bg-[#20b5ad] disabled:bg-gray-200 disabled:text-gray-400"
      >
        {isPending ? "Processing..." : "Agree & Continue"}
      </button>
    </div>
  );
}
