"use client";

import { useState } from "react";
import { useSubmitStep } from "@/hooks/usePairing";
import { useWallets } from "@privy-io/react-auth";
import type { PairingStep, TransactionPayload } from "@/lib/pairing";

interface Props {
  agentId: string;
  step: PairingStep;
}

export function TransactionStep({ agentId, step }: Props) {
  const { mutate: submitStep, isPending } = useSubmitStep(agentId);
  const { wallets } = useWallets();
  const [error, setError] = useState<string | null>(null);

  const payload = step.payload as unknown as TransactionPayload;
  const tx = payload.transaction;
  const metadata = payload.metadata;

  const handleSign = async () => {
    setError(null);
    try {
      const embeddedWallet = wallets.find(
        (w) => w.walletClientType === "privy"
      );
      if (!embeddedWallet) throw new Error("No embedded wallet found");

      const provider = await embeddedWallet.getEthereumProvider();

      const txHash = await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            to: tx.to,
            data: tx.data,
            value: tx.value,
          },
        ],
      });

      submitStep({
        ...step,
        response: { tx_hash: txHash },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed");
    }
  };

  return (
    <div className="px-6 py-8">
      <h1 className="text-xl font-bold text-gray-900">Sign Transaction</h1>
      <p className="mt-1 text-sm text-gray-500">{step.action}</p>

      <div className="mt-6 space-y-3 rounded-xl bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Contract</span>
          <span className="font-mono text-sm text-gray-900">
            {tx.to.slice(0, 10)}...{tx.to.slice(-8)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Chain ID</span>
          <span className="text-sm text-gray-900">{tx.chainId}</span>
        </div>
        {metadata?.function && (
          <div>
            <span className="text-sm text-gray-500">Function</span>
            <div className="mt-1 rounded-lg bg-white p-2 font-mono text-xs text-gray-900">
              {metadata.function.name}(
              {metadata.function.inputs
                .map((i) => `${i.name}: ${i.value}`)
                .join(", ")}
              )
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-500">{error}</p>
      )}

      <button
        onClick={handleSign}
        disabled={isPending}
        className="mt-8 w-full rounded-xl bg-[#27CEC5] py-3.5 font-semibold text-white transition-colors hover:bg-[#20b5ad] disabled:bg-gray-200 disabled:text-gray-400"
      >
        {isPending ? "Signing..." : "Sign & Continue"}
      </button>
    </div>
  );
}
