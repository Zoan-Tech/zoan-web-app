"use client";

import { Modal } from "@/components/ui/modal";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useTransactionHistory } from "@/hooks/use-transaction-history";
import { ArrowLineUpIcon, ArrowLineDownIcon } from "@phosphor-icons/react";
import type { Chain } from "@/types/wallet";

interface TransactionHistoryModalProps {
  open: boolean;
  onClose: () => void;
  address: string;
  chain: Chain;
}

function formatTimestamp(ts: string | null): string {
  if (!ts) return "";
  // Handle both ISO 8601 (Blockscout V2) and Unix epoch seconds (Etherscan)
  const num = Number(ts);
  let d: Date;
  if (!isNaN(num) && num > 0) {
    // Unix epoch seconds (numeric string)
    d = new Date(num * 1000);
  } else {
    // ISO 8601 string
    d = new Date(ts);
  }
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatWeiValue(weiStr: string): string {
  try {
    const wei = BigInt(weiStr);
    if (wei === BigInt(0)) return "0";
    const eth = Number(wei) / 1e18;
    return eth < 0.000001 ? "<0.000001" : eth.toFixed(6);
  } catch {
    return weiStr;
  }
}

export function TransactionHistoryModal({
  open,
  onClose,
  address,
  chain,
}: TransactionHistoryModalProps) {
  const { data: txs, isLoading } = useTransactionHistory(
    open ? address : undefined,
    chain.id
  );

  return (
    <Modal open={open} onClose={onClose} title="History" maxWidth="sm:max-w-md">
      {isLoading && (
        <div className="flex items-center justify-center py-10">
          <LoadingSpinner size="md" />
        </div>
      )}

      {!isLoading && (!txs || txs.length === 0) && (
        <p className="py-10 text-center text-sm text-gray-400">
          No transactions found on {chain.name}
        </p>
      )}

      {!isLoading && txs && txs.length > 0 && (
        <ul className="max-h-[60vh] divide-y divide-gray-50 overflow-y-auto">
          {txs.map((tx) => (
            <li key={`${tx.hash}-${tx.direction}`} className="flex items-center gap-3 py-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tx.direction === "sent"
                  ? "bg-red-50 text-red-500"
                  : "bg-green-50 text-green-500"
                  }`}
              >
                {tx.direction === "sent" ? (
                  <ArrowLineUpIcon className="h-4 w-4" weight="bold" />
                ) : (
                  <ArrowLineDownIcon className="h-4 w-4" weight="bold" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold capitalize text-gray-900">
                    {tx.direction === "sent" ? "Sent" : "Received"}
                  </span>
                  <span
                    className={`text-sm font-semibold ${tx.direction === "sent" ? "text-red-500" : "text-green-500"
                      }`}
                  >
                    {tx.direction === "sent" ? "-" : "+"}
                    {tx.value ? formatWeiValue(tx.value) : "—"}{" "}
                    {chain.symbol}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-xs text-gray-400">
                    {tx.direction === "sent"
                      ? `To: ${tx.to ? shortAddr(tx.to) : "—"}`
                      : `From: ${shortAddr(tx.from)}`}
                  </span>
                  {tx.timestamp && (
                    <span className="shrink-0 text-xs text-gray-400">
                      {formatTimestamp(tx.timestamp)}
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!isLoading && txs && txs.length > 0 && (
        <p className="mt-3 text-center text-xs text-gray-400">
          Showing last {txs.length} transactions on {chain.name}
        </p>
      )}
    </Modal>
  );
}
