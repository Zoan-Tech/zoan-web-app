"use client";

import Image from "next/image";
import { useSubmitStep } from "@/hooks/usePairing";
import type { PairingStep, ApiCallPayload } from "@/lib/pairing";

interface Props {
  agentId: string;
  step: PairingStep;
  stepNumber?: number;
  totalSteps?: number;
}

export function ApiCallStep({ agentId, step, stepNumber = 1, totalSteps = 4 }: Props) {
  const { mutate: submitStep, isPending } = useSubmitStep(agentId);

  const payload = step.payload as unknown as ApiCallPayload;

  const handleApprove = () => {
    submitStep({
      ...step,
      response: { approved: true },
    });
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Fixed top: image + progress dots */}
      <div className="flex flex-col items-center px-4 pt-4 pb-4">
        <Image src="/images/zoan.svg" alt="Zoan" width={160} height={160} />
        <div className="mt-4 flex gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all ${
                i + 1 === stepNumber ? "w-4 bg-[#27CEC5]" : "w-2 bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4">
        <h2 className="text-lg font-bold text-gray-900">API Call Approval</h2>
        <p className="mt-1 text-sm text-gray-500">{step.action}</p>

        <div className="mt-6 space-y-3 rounded-xl bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Method</span>
            <span className="text-sm font-semibold text-gray-900">
              {payload.method}
            </span>
          </div>
          <div>
            <span className="text-sm text-gray-500">Endpoint</span>
            <div className="mt-1 break-all rounded-lg bg-white p-2 font-mono text-sm text-gray-900">
              {payload.endpoint}
            </div>
          </div>
          {payload.body && (
            <div>
              <span className="text-sm text-gray-500">Request Body</span>
              <pre className="mt-1 overflow-x-auto rounded-lg bg-white p-2 text-xs text-gray-900">
                {JSON.stringify(payload.body, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Fixed bottom: button */}
      <div className="px-4 pt-4 pb-6">
        <button
          onClick={handleApprove}
          disabled={isPending}
          className="w-full rounded-xl bg-[#27CEC5] py-3.5 font-semibold text-white transition-colors hover:bg-[#20b5ad] disabled:bg-gray-200 disabled:text-gray-400"
        >
          {isPending ? "Processing..." : "Approve"}
        </button>
      </div>
    </div>
  );
}
