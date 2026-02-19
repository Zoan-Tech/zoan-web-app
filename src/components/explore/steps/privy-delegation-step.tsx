"use client";

import { useState } from "react";
import { useSigners, useWallets } from "@privy-io/react-auth";
import { useSubmitStep } from "@/hooks/use-pairing";
import { PairingStep } from "@/lib/pairing";

interface Props {
  agentId: string;
  step: PairingStep;
  stepNumber?: number;
  totalSteps?: number;
}

export function PrivyDelegationStep({
  agentId,
  step,
  stepNumber = 1,
  totalSteps = 4,
}: Props) {
  const { addSigners, removeSigners } = useSigners();
  const { wallets } = useWallets();
  const { mutate: submitStep, isPending } = useSubmitStep(agentId);
  const [isDelegating, setIsDelegating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signerId = step.payload?.signer_id as string | undefined;

  const handleDelegate = async () => {
    setIsDelegating(true);
    setError(null);
    try {
      if (!signerId) throw new Error("No signer ID provided by agent");
      const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");
      if (!embeddedWallet) throw new Error("No embedded wallet found");
      try {
        await addSigners({ address: embeddedWallet.address, signers: [{ signerId }] });
      } catch (addErr) {
        const msg = addErr instanceof Error ? addErr.message : "";
        if (msg.toLowerCase().includes("duplicate signer")) {
          await removeSigners({ address: embeddedWallet.address });
          await addSigners({ address: embeddedWallet.address, signers: [{ signerId }] });
        } else {
          throw addErr;
        }
      }
      submitStep({
        ...step,
        response: { success: true },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delegation failed");
    } finally {
      setIsDelegating(false);
    }
  };

  const isLoading = isDelegating || isPending;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-col items-center px-4 pt-4 pb-4">
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

      <div className="flex-1 overflow-y-auto px-4">
        <h2 className="text-lg font-bold text-gray-900">Delegate Wallet</h2>

        <div className="mt-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              Agent Wallet Access
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              This agent needs delegated access to your wallet to perform
              transactions on your behalf. You can revoke this at any time.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              What this allows
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              The agent will be able to sign transactions and interact with
              smart contracts using your wallet without requiring your manual
              approval each time.
            </p>
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-500">{error}</p>
        )}
      </div>

      <div className="px-4 pt-4 pb-6">
        <button
          onClick={handleDelegate}
          disabled={isLoading}
          className="w-full rounded-xl bg-[#27CEC5] py-3.5 font-semibold text-white transition-colors hover:bg-[#20b5ad] disabled:bg-gray-200 disabled:text-gray-400"
        >
          {isLoading ? "Processing..." : "Delegate Wallet"}
        </button>
      </div>
    </div>
  );
}
