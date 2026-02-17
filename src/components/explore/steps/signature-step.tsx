"use client";

import { useState } from "react";
import Image from "next/image";
import { useSubmitStep } from "@/hooks/use-pairing";
import { useWallets } from "@privy-io/react-auth";
import { createWalletClient, custom, recoverTypedDataAddress } from "viem";
import { arbitrumSepolia } from "viem/chains";
import type { PairingStep, EIP712Payload } from "@/lib/pairing";
import { WarningIcon } from "@phosphor-icons/react";

interface Props {
  agentId: string;
  step: PairingStep;
  stepNumber?: number;
  totalSteps?: number;
}

export function SignatureStep({ agentId, step, stepNumber = 1, totalSteps = 4 }: Props) {
  const { mutate: submitStep, isPending } = useSubmitStep(agentId);
  const { wallets } = useWallets();
  const [error, setError] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);

  const format = step.post_processing?.format ?? "eip712";
  const payload = step.payload as unknown as EIP712Payload;

  const handleSign = async () => {
    setError(null);
    setIsSigning(true);
    try {
      let signature: string;

      if (format === "eip712") {
        const { domain, types, primaryType, message } = payload;
        const embeddedWallet = wallets.find(
          (w) => w.walletClientType === "privy"
        );
        if (!embeddedWallet) throw new Error("No embedded wallet found");

        // Use viem walletClient wrapping Privy's provider
        // This lets viem handle EIP-712 encoding while using Privy's key for signing
        const provider = await embeddedWallet.getEthereumProvider();
        const walletClient = createWalletClient({
          account: embeddedWallet.address as `0x${string}`,
          chain: arbitrumSepolia,
          transport: custom(provider),
        });

        signature = await walletClient.signTypedData({
          account: embeddedWallet.address as `0x${string}`,
          domain: domain as Parameters<typeof walletClient.signTypedData>[0]["domain"],
          types: types as Parameters<typeof walletClient.signTypedData>[0]["types"],
          primaryType: primaryType as string,
          message,
        });

        // Verify locally
        const recoveredAddress = await recoverTypedDataAddress({
          domain: domain as Parameters<typeof recoverTypedDataAddress>[0]["domain"],
          types: types as Parameters<typeof recoverTypedDataAddress>[0]["types"],
          primaryType: primaryType as string,
          message,
          signature: signature as `0x${string}`,
        });
        
      } else {
        throw new Error("Unsupported signature format: " + format);
      }

      const r = "0x" + signature.slice(2, 66);
      const s = "0x" + signature.slice(66, 130);
      const v = parseInt(signature.slice(130, 132), 16);

      submitStep({
        ...step,
        response: { signature: { r, s, v } },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signature failed");
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
        <h2 className="text-lg font-bold text-gray-900">Signature Request</h2>
        <p className="mt-1 text-sm text-gray-500">{step.action}</p>

        <div className="mt-6 space-y-3 rounded-xl bg-gray-50 p-4">
          {format === "eip712" ? (
            <>
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
            </>
          ) : (
            <div>
              <span className="text-sm text-gray-500">Data to sign</span>
              <pre className="mt-1 overflow-x-auto rounded-lg bg-white p-2 text-xs text-gray-900">
                {JSON.stringify(step.payload, null, 2)}
              </pre>
            </div>
          )}
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
      </div>

      {/* Fixed bottom: button */}
      <div className="px-4 pt-4 pb-6">
        <button
          onClick={handleSign}
          disabled={isPending || isSigning}
          className="w-full rounded-xl bg-[#27CEC5] py-3.5 font-semibold text-white transition-colors hover:bg-[#20b5ad] disabled:bg-gray-200 disabled:text-gray-400"
        >
          {isSigning ? "Signing..." : isPending ? "Submitting..." : "Approve"}
        </button>
      </div>
    </div>
  );
}
