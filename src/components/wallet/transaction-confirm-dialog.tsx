"use client";

import { Modal } from "@/components/ui/modal";
import { LoadingButton } from "@/components/ui/loading-button";
import { getNetworkColor } from "@/lib/wallet/network-colors";
import { formatUsd } from "@/services/token-price";
import type { Chain } from "@/types/wallet";
import type { GasEstimation } from "@/hooks/useGasEstimation";
import { ShieldCheckIcon } from "@phosphor-icons/react";

interface TransactionConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  token: { symbol: string; name: string; logo_url?: string };
  amount: string;
  amountUsd: number;
  recipient: string;
  chain: Chain;
  gasEstimation: GasEstimation;
  payWithAddress: string;
  payWithBalance: string;
}

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function TransactionConfirmDialog({
  open,
  onClose,
  onConfirm,
  isLoading,
  token,
  amount,
  amountUsd,
  recipient,
  chain,
  gasEstimation,
  payWithAddress,
  payWithBalance,
}: TransactionConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="pt-2 text-center">
        {/* Icon */}
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#E0FAF8]">
          <span className="text-2xl font-bold text-[#27CEC5]">Z</span>
        </div>

        <h2 className="text-lg font-semibold text-gray-900">
          Approve transaction
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Zoan wants your permission to send this transaction
        </p>
      </div>

      {/* Amount */}
      <div className="mt-4 text-center">
        <p className="text-2xl font-bold text-gray-900">
          {amount} {token.symbol}
        </p>
        <p className="text-sm text-gray-500">{formatUsd(amountUsd)}</p>
      </div>

      {/* Details */}
      <div className="mt-4 space-y-3 rounded-xl bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">To</span>
          <span className="font-mono text-sm text-gray-900" title={recipient}>
            {formatAddress(recipient)}
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
          <span className="text-sm text-gray-500">Est. fee</span>
          <span className="text-sm text-gray-900">
            {gasEstimation.gasCostFormatted} {chain.symbol}{" "}
            <span className="text-gray-500">
              ({formatUsd(gasEstimation.gasCostUsd)})
            </span>
          </span>
        </div>
      </div>

      {/* Pay with */}
      <div className="mt-3 flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
        <span className="text-sm text-gray-500">Pay with</span>
        <span className="text-sm text-gray-900">
          {formatAddress(payWithAddress)}{" "}
          <span className="text-gray-500">
            {payWithBalance} {chain.symbol}
          </span>
        </span>
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
          loadingText="Sending..."
          onClick={onConfirm}
          className="flex-1 rounded-xl"
        >
          Approve
        </LoadingButton>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-400">
        <ShieldCheckIcon className="h-4 w-4" />
        <span>Protected by Zoan</span>
      </div>
    </Modal>
  );
}
