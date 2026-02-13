"use client";

import { useState } from "react";
import Image from "next/image";
import { useSubmitStep } from "@/hooks/usePairing";
import { useWallets } from "@privy-io/react-auth";
import type { PairingStep, TransactionPayload } from "@/lib/pairing";

interface Props {
  agentId: string;
  step: PairingStep;
  stepNumber?: number;
  totalSteps?: number;
}

export function TransactionStep({ agentId, step, stepNumber = 1, totalSteps = 4 }: Props) {
  const { mutate: submitStep, isPending } = useSubmitStep(agentId);
  const { wallets } = useWallets();
  const [error, setError] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);

  const payload = step.payload as unknown as TransactionPayload;
  const tx = payload.transaction;
  const metadata = tx.metadata;

  const handleSign = async () => {
    setError(null);
    setIsSigning(true);
    try {
      const embeddedWallet = wallets.find(
        (w) => w.walletClientType === "privy"
      );
      if (!embeddedWallet) throw new Error("No embedded wallet found");

      await embeddedWallet.switchChain(tx.chainId);

      const provider = await embeddedWallet.getEthereumProvider();

      const txHash = await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            to: tx.to,
            data: tx.data,
            value: tx.value,
            chainId: `0x${tx.chainId.toString(16)}`,
          },
        ],
      });

      submitStep({
        ...step,
        response: { tx_hash: txHash },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setIsSigning(false);
    }
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
        <h2 className="text-lg font-bold text-gray-900">Sign Transaction</h2>
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

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
      </div>

      {/* Fixed bottom: button */}
      <div className="px-4 pt-4 pb-6">
        <button
          onClick={handleSign}
          disabled={isPending || isSigning}
          className="w-full rounded-xl bg-[#27CEC5] py-3.5 font-semibold text-white transition-colors hover:bg-[#20b5ad] disabled:bg-gray-200 disabled:text-gray-400"
        >
          {isSigning ? "Signing..." : isPending ? "Submitting..." : "Sign & Continue"}
        </button>
      </div>
    </div>
  );
}
