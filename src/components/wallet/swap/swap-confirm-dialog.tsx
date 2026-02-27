"use client";

import { Modal } from "@/components/ui/modal";
import { LoadingButton } from "@/components/ui/loading-button";
import { getNetworkColor } from "@/lib/wallet/network-colors";
import { formatUsd } from "@/services/token-price";
import type { Chain } from "@/types/wallet";
import { ArrowDownIcon, ShieldCheckIcon } from "@phosphor-icons/react";

interface TokenInfo {
  symbol: string;
  name: string;
  logo_url?: string;
}

interface SwapConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  loadingText?: string;
  fromToken: TokenInfo;
  toToken: TokenInfo;
  fromAmount: string;
  fromAmountUsd: number;
  toAmount: string;
  toAmountUsd: number;
  exchangeRate: string;
  chain: Chain;
  estimatedGasUsd?: number;
  slippageBps: number;
}

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function SwapConfirmDialog({
  open,
  onClose,
  onConfirm,
  isLoading,
  loadingText = "Swapping...",
  fromToken,
  toToken,
  fromAmount,
  fromAmountUsd,
  toAmount,
  toAmountUsd,
  exchangeRate,
  chain,
  estimatedGasUsd,
  slippageBps,
}: SwapConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="pt-2 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#E0FAF8]">
          <span className="text-2xl font-bold text-[#27CEC5]">Z</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Approve swap</h2>
        <p className="mt-1 text-sm text-gray-500">
          Zoan wants your permission to execute this swap
        </p>
      </div>

      {/* From → To amounts */}
      <div className="mt-4 space-y-1">
        {/* From */}
        <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
          <div className="flex items-center gap-2">
            {fromToken.logo_url ? (
              <img
                src={fromToken.logo_url}
                alt={fromToken.symbol}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                <span className="text-xs font-bold text-gray-600">
                  {fromToken.symbol[0]}
                </span>
              </div>
            )}
            <span className="font-semibold text-gray-900">{fromToken.symbol}</span>
          </div>
          <div className="text-right">
            <p className="font-semibold text-gray-900">
              -{fromAmount} {fromToken.symbol}
            </p>
            <p className="text-xs text-gray-500">{formatUsd(fromAmountUsd)}</p>
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
            {toToken.logo_url ? (
              <img
                src={toToken.logo_url}
                alt={toToken.symbol}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                <span className="text-xs font-bold text-gray-600">
                  {toToken.symbol[0]}
                </span>
              </div>
            )}
            <span className="font-semibold text-gray-900">{toToken.symbol}</span>
          </div>
          <div className="text-right">
            <p className="font-semibold text-[#27CEC5]">
              +{toAmount} {toToken.symbol}
            </p>
            <p className="text-xs text-gray-500">{formatUsd(toAmountUsd)}</p>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="mt-3 space-y-2.5 rounded-xl bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Rate</span>
          <span className="text-sm text-gray-900">
            1 {fromToken.symbol} ≈ {exchangeRate} {toToken.symbol}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Network</span>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-900">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: getNetworkColor(chain.id) }}
            />
            {chain.name}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Slippage</span>
          <span className="text-sm text-gray-900">{slippageBps / 100}%</span>
        </div>
        {estimatedGasUsd !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Est. fee</span>
            <span className="text-sm text-gray-900">
              {formatUsd(estimatedGasUsd)}
            </span>
          </div>
        )}
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
