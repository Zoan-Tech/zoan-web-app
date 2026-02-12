"use client";

import { useSubmitStep } from "@/hooks/usePairing";
import type { PairingStep, ApiCallPayload } from "@/lib/pairing";

interface Props {
  agentId: string;
  step: PairingStep;
}

export function ApiCallStep({ agentId, step }: Props) {
  const { mutate: submitStep, isPending } = useSubmitStep(agentId);

  const payload = step.payload as unknown as ApiCallPayload;

  const handleApprove = () => {
    submitStep({
      ...step,
      response: { approved: true },
    });
  };

  return (
    <div className="px-6 py-8">
      <h1 className="text-xl font-bold text-gray-900">API Call Approval</h1>
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

      <button
        onClick={handleApprove}
        disabled={isPending}
        className="mt-8 w-full rounded-xl bg-[#27CEC5] py-3.5 font-semibold text-white transition-colors hover:bg-[#20b5ad] disabled:bg-gray-200 disabled:text-gray-400"
      >
        {isPending ? "Processing..." : "Approve"}
      </button>
    </div>
  );
}
