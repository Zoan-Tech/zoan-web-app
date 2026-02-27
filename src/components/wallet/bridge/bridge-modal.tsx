"use client";

import { useState } from "react";
import { useWallets } from "@privy-io/react-auth";
import { Modal } from "@/components/ui/modal";
import { BridgeForm } from "./bridge-form";
import { useChains } from "@/hooks/use-chains";
import { useWalletStore } from "@/stores/wallet";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { isBridgeSupported } from "@/services/bridge";

interface BridgeModalProps {
  open: boolean;
  onClose: () => void;
  initialChainId?: number;
}

export function BridgeModal({ open, onClose, initialChainId = 8453 }: BridgeModalProps) {
  const { wallets } = useWallets();
  const { isInitialized, isInitializing } = useWalletStore();

  const { mainnets, testnets, getChainById } = useChains();

  const [sourceChainId, setSourceChainId] = useState(initialChainId);
  const defaultDestId = mainnets.find((c) => c.id !== initialChainId && isBridgeSupported(c.id))?.id ?? 42161;
  const [destChainId, setDestChainId] = useState(defaultDestId);

  const sourceChain = getChainById(sourceChainId);
  const destChain = getChainById(destChainId);

  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");

  const allChains = [...mainnets, ...testnets];

  return (
    <Modal open={open} onClose={onClose} title="Bridge">
      {isInitializing || !isInitialized || !embeddedWallet || !sourceChain || !destChain ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-500">Loading wallet...</p>
        </div>
      ) : (
        <BridgeForm
          key={sourceChainId}
          address={embeddedWallet.address}
          sourceChain={sourceChain}
          destChain={destChain}
          allChains={allChains}
          onSourceChainChange={(id) => {
            setSourceChainId(id);
            if (id === destChainId) {
              const newDest = mainnets.find((c) => c.id !== id && isBridgeSupported(c.id));
              if (newDest) setDestChainId(newDest.id);
            }
          }}
          onDestChainChange={(id) => {
            setDestChainId(id);
            if (id === sourceChainId) {
              const newSource = mainnets.find((c) => c.id !== id && isBridgeSupported(c.id));
              if (newSource) setSourceChainId(newSource.id);
            }
          }}
          embeddedWallet={embeddedWallet}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}
