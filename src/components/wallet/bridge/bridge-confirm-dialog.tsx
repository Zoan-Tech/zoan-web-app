"use client";

import { Modal } from "@/components/ui/modal";
import { LoadingButton } from "@/components/ui/loading-button";
import { getNetworkColor } from "@/lib/wallet/network-colors";
import { formatUsd } from "@/services/token-price";
import type { Chain } from "@/types/wallet";
import { ArrowDownIcon, ShieldCheckIcon, ClockIcon, CheckCircleIcon, ArrowSquareOutIcon } from "@phosphor-icons/react";
import Image from "next/image";

interface TokenInfo {
  symbol: string;
  name: string;
  logo_url?: string;
}

interface BridgeConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  loadingText?: string;
  token: TokenInfo;
  amount: string;
  amountUsd: number;
  receiveAmount: string;
  receiveSymbol: string;
  sourceChain: Chain;
  destChain: Chain;
  feeUsd: number;
  txHash?: string | null;
  explorerUrl?: string;
}

export function BridgeConfirmDialog({
  open,
  onClose,
  onConfirm,
  isLoading,
  loadingText = "Bridging...",
  token,
  amount,
  amountUsd,
  receiveAmount,
  receiveSymbol,
  sourceChain,
  destChain,
  feeUsd,
  txHash,
  explorerUrl,
}: BridgeConfirmDialogProps) {
  if (txHash) {
    return (
      <Modal open={open} onClose={onClose}>
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E0FAF8]">
            <CheckCircleIcon className="h-9 w-9 text-[#27CEC5]" weight="fill" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Bridge submitted!</h2>
            <p className="mt-1 text-sm text-gray-500">
              Your bridge transaction is being processed. Funds should arrive on {destChain.name} in ~2-5 minutes.
            </p>
          </div>
          <div className="w-full rounded-xl bg-gray-50 px-4 py-3 text-left text-xs text-gray-500">
            <span className="font-medium text-gray-700">TX hash</span>
            <p className="mt-0.5 break-all font-mono text-gray-400">{txHash}</p>
          </div>
          <div className="flex w-full gap-3">
            {explorerUrl && (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                View on Explorer
                <ArrowSquareOutIcon className="h-4 w-4" />
              </a>
            )}
            <button
              onClick={onClose}
              className="flex-1 rounded-xl bg-[#27CEC5] py-3 text-sm font-medium text-white transition-colors hover:bg-[#1fb8b0]"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="pt-2 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#E0FAF8]">
          <span className="text-2xl font-bold text-[#27CEC5]">Z</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Approve bridge</h2>
        <p className="mt-1 text-sm text-gray-500">
          Zoan wants your permission to execute this bridge
        </p>
      </div>

      {/* From → To amounts */}
      <div className="mt-4 space-y-1">
        {/* From */}
        <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
          <div className="flex items-center gap-2">
            {token.logo_url ? (
              <Image
                src={token.logo_url}
                alt={token.symbol}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                <span className="text-xs font-bold text-gray-600">{token.symbol[0]}</span>
              </div>
            )}
            <div>
              <span className="font-semibold text-gray-900">{token.symbol}</span>
              <p className="flex items-center gap-1 text-xs text-gray-400">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: getNetworkColor(sourceChain.id) }}
                />
                {sourceChain.name}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-900">
              -{amount} {token.symbol}
            </p>
            {amountUsd > 0 && (
              <p className="text-xs text-gray-500">{formatUsd(amountUsd)}</p>
            )}
          </div>
        </div>

        {/* Arrow */}
        <div className="flex justify-center py-1">
          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white">
            <ArrowDownIcon className="h-3.5 w-3.5 text-gray-400" />
          </div>
        </div>

        {/* To */}
        <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
          <div className="flex items-center gap-2">
            {destChain.logo_url ? (
              <Image
                src={destChain.logo_url}
                alt={destChain.symbol}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                <span className="text-xs font-bold text-gray-600">{destChain.symbol[0]}</span>
              </div>
            )}
            <div>
              <span className="font-semibold text-gray-900">{receiveSymbol}</span>
              <p className="flex items-center gap-1 text-xs text-gray-400">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: getNetworkColor(destChain.id) }}
                />
                {destChain.name}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold text-[#27CEC5]">
              +{receiveAmount} {receiveSymbol}
            </p>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="mt-3 space-y-2.5 rounded-xl bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">From</span>
          <span className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: getNetworkColor(sourceChain.id) }}
            />
            {sourceChain.name}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">To</span>
          <span className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: getNetworkColor(destChain.id) }}
            />
            {destChain.name}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Bridge fee</span>
          <span className="text-sm text-gray-900">
            {feeUsd > 0 ? formatUsd(feeUsd) : "Included"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm text-gray-500">
            <ClockIcon className="h-3.5 w-3.5" />
            Est. time
          </span>
          <span className="text-sm text-gray-900">~2-5 minutes</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Powered by</span>
          <span className="text-sm font-medium text-gray-900">Orbiter Finance</span>
        </div>
      </div>

      {/* Buttons */}
      <div className="mt-4 flex gap-3">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="flex-1 rounded-xl border border-gray-200 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          Reject
        </button>
        <LoadingButton
          isLoading={isLoading}
          loadingText={loadingText}
          onClick={onConfirm}
          className="flex-1 rounded-xl"
        >
          Approve
        </LoadingButton>
      </div>

      <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-400">
        <ShieldCheckIcon className="h-4 w-4" />
        <span>Protected by Zoan</span>
      </div>
    </Modal>
  );
}
