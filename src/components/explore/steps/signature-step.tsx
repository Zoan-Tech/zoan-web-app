"use client";

import { useState } from "react";
import { useSubmitStep } from "@/hooks/usePairing";
import { useWallets } from "@privy-io/react-auth";
import type { PairingStep, EIP712Payload } from "@/lib/pairing";
import { WarningIcon } from "@phosphor-icons/react";

interface Props {
  agentId: string;
  step: PairingStep;
}

export function SignatureStep({ agentId, step }: Props) {
  const { mutate: submitStep, isPending } = useSubmitStep(agentId);
  const { wallets } = useWallets();
  const [error, setError] = useState<string | null>(null);

  const payload = step.payload as unknown as EIP712Payload;

  const handleSign = async () => {
    setError(null);
    try {
      const embeddedWallet = wallets.find(
        (w) => w.walletClientType === "privy"
      );
      if (!embeddedWallet) throw new Error("No wallet found");

      const provider = await embeddedWallet.getEthereumProvider();

      const signature = (await provider.request({
        method: "eth_signTypedData_v4",
        params: [embeddedWallet.address, JSON.stringify(payload)],
      })) as string;

      const r = "0x" + signature.slice(2, 66);
      const s = "0x" + signature.slice(66, 130);
      const v = parseInt(signature.slice(130, 132), 16);

      submitStep({
        ...step,
        response: { signature: { r, s, v } },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signature failed");
    }
  };

  return (
    <div className="px-6 py-8">
      <h1 className="text-xl font-bold text-gray-900">Signature Request</h1>
      <p className="mt-1 text-sm text-gray-500">{step.action}</p>

      <div className="mt-6 space-y-3 rounded-xl bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Contract</span>
          <span className="text-sm text-gray-900">{payload.domain.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Address</span>
          <span className="font-mono text-sm text-gray-900">
            {payload.domain.verifyingContract.slice(0, 10)}...
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Chain ID</span>
          <span className="text-sm text-gray-900">
            {payload.domain.chainId}
          </span>
        </div>
        <div>
          <span className="text-sm text-gray-500">Message</span>
          <pre className="mt-1 overflow-x-auto rounded-lg bg-white p-2 text-xs text-gray-900">
            {JSON.stringify(payload.message, null, 2)}
          </pre>
        </div>
      </div>

      <div className="mt-4 flex gap-2 rounded-xl bg-amber-50 p-3">
        <WarningIcon
          size={18}
          weight="fill"
          className="mt-0.5 flex-shrink-0 text-amber-500"
        />
        <p className="text-xs text-amber-700">
          Only sign if you trust this agent. This signature grants permissions
          on-chain.
        </p>
      </div>

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

      <button
        onClick={handleSign}
        disabled={isPending}
        className="mt-8 w-full rounded-xl bg-[#27CEC5] py-3.5 font-semibold text-white transition-colors hover:bg-[#20b5ad] disabled:bg-gray-200 disabled:text-gray-400"
      >
        {isPending ? "Signing..." : "Approve"}
      </button>
    </div>
  );
}
