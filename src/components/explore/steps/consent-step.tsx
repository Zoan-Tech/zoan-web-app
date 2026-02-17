"use client";

import Image from "next/image";
import { useSubmitStep } from "@/hooks/use-pairing";
import { PairingStep } from "@/lib/pairing";

interface Props {
  agentId: string;
  step: PairingStep;
  stepNumber?: number;
  totalSteps?: number;
}

export function ConsentStep({ agentId, step, stepNumber = 1, totalSteps = 4 }: Props) {
  const { mutate: submitStep, isPending } = useSubmitStep(agentId);

  const handleAgree = () => {
    submitStep({
      ...step,
      response: { consented: true },
    });
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Fixed top: image + progress dots */}
      <div className="flex flex-col items-center px-4 pt-4 pb-4">
        <Image
          src="/images/zoan.svg"
          alt="Zoan"
          width={160}
          height={160}
        />
        <div className="mt-4 flex gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i + 1 === stepNumber
                  ? "w-4 bg-[#27CEC5]"
                  : "w-2 bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4">
        <h2 className="text-lg font-bold text-gray-900">Terms & Policy</h2>

        <div className="mt-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Know Your Agent (KYA)
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              By proceeding, you agree to link your identity with this agent
              and authorize data sharing between your Zoan Identity and the
              agent.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Data usage
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Your wallet address and email will be synced to establish a
              verified relationship with this agent.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900">Privacy</h3>
            <p className="mt-1 text-sm text-gray-500">
              We protect your data according to our privacy policy. You can
              revoke access at any time.
            </p>
          </div>
        </div>
      </div>

      {/* Fixed bottom: button */}
      <div className="px-4 pt-4 pb-6">
        <button
          onClick={handleAgree}
          disabled={isPending}
          className="w-full rounded-xl bg-[#27CEC5] py-3.5 font-semibold text-white transition-colors hover:bg-[#20b5ad] disabled:bg-gray-200 disabled:text-gray-400"
        >
          {isPending ? "Processing..." : "Agree & continue"}
        </button>
      </div>
    </div>
  );
}
