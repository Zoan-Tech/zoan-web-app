"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Modal } from "@/components/ui/modal";
import { getNetworkColor } from "@/lib/wallet/network-colors";
import type { Chain } from "@/types/wallet";
import {
  CopyIcon,
  CheckIcon,
  ShareNetworkIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";

interface ReceiveModalProps {
  open: boolean;
  onClose: () => void;
  address: string;
  chain: Chain;
}

export function ReceiveModal({
  open,
  onClose,
  address,
  chain,
}: ReceiveModalProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setIsCopied(true);
      toast.success("Address copied!");
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error("Failed to copy address");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: address });
      } catch {
        // User cancelled sharing
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Receive">
      {/* Network badge */}
      <div className="mb-4 flex justify-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: getNetworkColor(chain.id) }}
          />
          {chain.name}
        </span>
      </div>

      {/* QR Code */}
      <div className="flex justify-center">
        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <QRCodeSVG value={address} size={200} />
        </div>
      </div>

      {/* Address */}
      <div className="mt-4 rounded-xl bg-gray-50 p-3">
        <p className="break-all text-center font-mono text-sm text-gray-700">
          {address}
        </p>
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex gap-3">
        <button
          onClick={handleCopy}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#E0FAF8] py-3 font-medium text-[#27CEC5] transition-colors hover:bg-[#c8f5f1]"
        >
          {isCopied ? (
            <CheckIcon className="h-5 w-5" />
          ) : (
            <CopyIcon className="h-5 w-5" />
          )}
          {isCopied ? "Copied" : "Copy"}
        </button>
        <button
          onClick={handleShare}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-200"
        >
          <ShareNetworkIcon className="h-5 w-5" />
          Share
        </button>
      </div>

      {/* Warning */}
      <div className="mt-4 rounded-xl bg-amber-50 p-3">
        <p className="text-center text-xs text-amber-700">
          Only send {chain.symbol} and tokens on the {chain.name} network to
          this address. Sending other assets may result in permanent loss.
        </p>
      </div>
    </Modal>
  );
}
