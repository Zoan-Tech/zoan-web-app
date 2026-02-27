"use client";

import { useState } from "react";
import Image from "next/image";
import { useWallets } from "@privy-io/react-auth";
import { Modal } from "@/components/ui/modal";
import { SwapForm } from "./swap-form";
import { useChains } from "@/hooks/use-chains";
import { useWalletStore } from "@/stores/wallet";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CaretDownIcon, CheckIcon } from "@phosphor-icons/react";

interface SwapModalProps {
  open: boolean;
  onClose: () => void;
  initialChainId?: number;
}

export function SwapModal({ open, onClose, initialChainId = 8453 }: SwapModalProps) {
  const { wallets } = useWallets();
  const { isInitialized, isInitializing } = useWalletStore();
  const [selectedChainId, setSelectedChainId] = useState(initialChainId);
  const [showChainSelector, setShowChainSelector] = useState(false);

  const { mainnets, testnets, getChainById } = useChains();
  const chain = getChainById(selectedChainId);

  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");

  return (
    <Modal open={open} onClose={onClose} title="Swap">
      {isInitializing || !isInitialized || !embeddedWallet || !chain ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-500">Loading wallet...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Chain selector */}
          <div className="relative">
            <button
              onClick={() => setShowChainSelector(!showChainSelector)}
              className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              {chain.logo_url ? (
                <Image src={chain.logo_url} alt={chain.name} width={18} height={18} className="rounded" unoptimized />
              ) : (
                <div className="h-4 w-4 rounded bg-gray-200" />
              )}
              <span>{chain.name}</span>
              <CaretDownIcon className="h-3.5 w-3.5 text-gray-400" />
            </button>

            {showChainSelector && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowChainSelector(false)} />
                <div className="absolute left-0 top-full z-20 mt-2 max-h-80 w-52 overflow-y-auto rounded-xl bg-white py-2 shadow-lg ring-1 ring-black/5">
                  <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Mainnets</p>
                  {mainnets.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedChainId(c.id); setShowChainSelector(false); }}
                      className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        {c.logo_url ? (
                          <Image src={c.logo_url} alt={c.name} width={18} height={18} className="rounded" unoptimized />
                        ) : (
                          <div className="h-4 w-4 rounded bg-gray-200" />
                        )}
                        <span>{c.name}</span>
                      </div>
                      {c.id === selectedChainId && <CheckIcon className="h-4 w-4 text-[#27CEC5]" />}
                    </button>
                  ))}
                  <div className="my-1 border-t border-gray-100" />
                  <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Testnets</p>
                  {testnets.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedChainId(c.id); setShowChainSelector(false); }}
                      className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        {c.logo_url ? (
                          <Image src={c.logo_url} alt={c.name} width={18} height={18} className="rounded" unoptimized />
                        ) : (
                          <div className="h-4 w-4 rounded bg-gray-200" />
                        )}
                        <span>{c.name}</span>
                      </div>
                      {c.id === selectedChainId && <CheckIcon className="h-4 w-4 text-[#27CEC5]" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* key resets form state when chain changes */}
          <SwapForm
            key={selectedChainId}
            address={embeddedWallet.address}
            chainId={selectedChainId}
            chain={chain}
            embeddedWallet={embeddedWallet}
            onClose={onClose}
          />
        </div>
      )}
    </Modal>
  );
}
