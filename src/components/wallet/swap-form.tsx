"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTokenBalances } from "@/hooks/use-token-balances";
import { useSwapQuote } from "@/hooks/use-swap-quote";
import { checkAllowance, encodeApproval, isSwapSupported } from "@/services/swap";
import { formatUsd } from "@/services/token-price";
import { LoadingButton } from "@/components/ui/loading-button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { SwapConfirmDialog } from "./swap-confirm-dialog";
import type { Chain } from "@/types/wallet";
import {
  ArrowsDownUpIcon,
  CaretDownIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";

interface SwapFormProps {
  address: string;
  chainId: number;
  chain: Chain;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  embeddedWallet: any;
}

type SelectedToken = "native" | string;

const SLIPPAGE_OPTIONS = [
  { label: "0.1%", bps: 10 },
  { label: "0.5%", bps: 50 },
  { label: "1%", bps: 100 },
  { label: "3%", bps: 300 },
];

export function SwapForm({ address, chainId, chain, embeddedWallet }: SwapFormProps) {
  const router = useRouter();
  const { nativeBalance, nativeUsdPrice, tokens } = useTokenBalances(address, chainId);

  const [fromToken, setFromToken] = useState<SelectedToken>("native");
  const [toToken, setToToken] = useState<SelectedToken>(() => {
    // Default "to" to first ERC20 if available, otherwise keep same (user must change)
    return "native";
  });
  const [fromAmount, setFromAmount] = useState("");
  const [slippageBps, setSlippageBps] = useState(50);
  const [showFromSelector, setShowFromSelector] = useState(false);
  const [showToSelector, setShowToSelector] = useState(false);

  const fromSelectorRef = useRef<HTMLDivElement>(null);
  const toSelectorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showFromSelector && !showToSelector) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (showFromSelector && fromSelectorRef.current && !fromSelectorRef.current.contains(e.target as Node)) {
        setShowFromSelector(false);
      }
      if (showToSelector && toSelectorRef.current && !toSelectorRef.current.contains(e.target as Node)) {
        setShowToSelector(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFromSelector, showToSelector]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

  // Resolve token metadata
  const isFromNative = fromToken === "native";
  const isToNative = toToken === "native";

  const fromErc20 = !isFromNative
    ? tokens.find((t) => t.address.toLowerCase() === fromToken.toLowerCase())
    : null;
  const toErc20 = !isToNative
    ? tokens.find((t) => t.address.toLowerCase() === toToken.toLowerCase())
    : null;

  const fromSymbol = isFromNative ? chain.symbol : fromErc20?.symbol ?? "???";
  const fromName = isFromNative ? chain.name : fromErc20?.name ?? "Unknown";
  const fromLogoUrl = isFromNative ? chain.logo_url : fromErc20?.logo_url;
  const fromBalance = isFromNative ? nativeBalance : fromErc20?.balance ?? "0";
  const fromDecimals = isFromNative ? 18 : fromErc20?.decimals ?? 18;
  const fromUsdPrice = isFromNative ? nativeUsdPrice : fromErc20?.usd_price ?? 0;

  const toSymbol = isToNative ? chain.symbol : toErc20?.symbol ?? "???";
  const toName = isToNative ? chain.name : toErc20?.name ?? "Unknown";
  const toLogoUrl = isToNative ? chain.logo_url : toErc20?.logo_url;
  const toDecimals = isToNative ? 18 : toErc20?.decimals ?? 18;
  const toUsdPrice = isToNative ? nativeUsdPrice : toErc20?.usd_price ?? 0;

  const fromAmountUsd = fromUsdPrice * (parseFloat(fromAmount) || 0);

  // Swap quote
  const { quote, isLoading: isQuoteLoading, error: quoteError } = useSwapQuote({
    chainId,
    sellToken: fromToken,
    buyToken: toToken,
    fromAmount,
    sellDecimals: fromDecimals,
    buyDecimals: toDecimals,
    taker: address,
    slippageBps,
    enabled: isSwapSupported(chainId) && fromToken !== toToken,
  });

  const toAmountFormatted = quote?.buyAmountFormatted ?? "";
  const toAmountUsd = toUsdPrice * (parseFloat(toAmountFormatted) || 0);
  const exchangeRate = quote?.price ?? "";

  const handleMaxAmount = () => setFromAmount(fromBalance);

  const handleFlip = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount("");
  };

  const handleSelectFrom = (token: SelectedToken) => {
    if (token === toToken) {
      // Auto-flip if selecting the same token
      setToToken(fromToken);
    }
    setFromToken(token);
    setFromAmount("");
    setShowFromSelector(false);
  };

  const handleSelectTo = (token: SelectedToken) => {
    if (token === fromToken) {
      setFromToken(toToken);
    }
    setToToken(token);
    setShowToSelector(false);
  };

  const handleReview = () => {
    if (!quote) return;
    setShowConfirmDialog(true);
  };

  const handleSwap = async () => {
    if (!quote) return;

    setIsSwapping(true);
    try {
      const provider = await embeddedWallet.getEthereumProvider();

      // Switch chain
      try {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x" + chainId.toString(16) }],
        });
      } catch {
        // Already on correct chain or switch not needed
      }

      // If selling ERC20, check and handle token approval
      if (!isFromNative && quote.allowanceTarget) {
        setIsApproving(true);
        try {
          const currentAllowance = await checkAllowance(
            chainId,
            fromToken,
            address,
            quote.allowanceTarget
          );

          const requiredAmount = BigInt(quote.sellAmount);
          if (currentAllowance < requiredAmount) {
            const approveData = encodeApproval(quote.allowanceTarget);
            toast.loading("Approving token...", { id: "approve" });

            const approveTxHash = await provider.request({
              method: "eth_sendTransaction",
              params: [{ from: address, to: fromToken, value: "0x0", data: approveData }],
            });

            // Wait for approval to be included
            await waitForTx(chainId, approveTxHash as string);
            toast.success("Token approved!", { id: "approve" });
          }
        } finally {
          setIsApproving(false);
        }
      }

      // Execute swap
      const { to, data, value, gas, gasPrice } = quote.transaction;
      const txHash = await provider.request({
        method: "eth_sendTransaction",
        params: [{ from: address, to, data, value, gas, gasPrice }],
      });

      toast.success("Swap submitted!", {
        description: `TX: ${(txHash as string).slice(0, 10)}...`,
        action: {
          label: "View",
          onClick: () =>
            window.open(`${chain.explorer_url}/tx/${txHash}`, "_blank"),
        },
      });

      router.push("/wallet");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error("Swap failed", { description: message });
    } finally {
      setIsSwapping(false);
      setShowConfirmDialog(false);
    }
  };

  const isFormValid =
    isSwapSupported(chainId) &&
    fromToken !== toToken &&
    parseFloat(fromAmount) > 0 &&
    parseFloat(fromAmount) <= parseFloat(fromBalance) &&
    !!quote;

  // ENI chain — swap not yet configured
  if (!isSwapSupported(chainId)) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-gray-50 p-8 text-center">
        <WarningCircleIcon className="h-10 w-10 text-amber-400" />
        <div>
          <p className="font-semibold text-gray-900">Swap on {chain.name}</p>
          <p className="mt-1 text-sm text-gray-500">
            Swap for {chain.name} is coming soon. Stay tuned!
          </p>
        </div>
        <button
          onClick={() => router.push("/wallet")}
          className="text-sm text-[#27CEC5] hover:underline"
        >
          Back to Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* From */}
      <div className="rounded-xl border border-gray-200 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">You pay</span>
          <span className="text-xs text-gray-400">
            Balance: {fromBalance} {fromSymbol}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Token picker */}
          <div className="relative shrink-0" ref={fromSelectorRef}>
            <button
              onClick={() => {
                setShowFromSelector(!showFromSelector);
                setShowToSelector(false);
              }}
              className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-200"
            >
              {fromLogoUrl ? (
                <img src={fromLogoUrl} alt={fromSymbol} className="h-5 w-5 rounded-full" />
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-300">
                  <span className="text-xs font-bold">{fromSymbol[0]}</span>
                </div>
              )}
              {fromSymbol}
              <CaretDownIcon className="h-3.5 w-3.5 text-gray-500" />
            </button>

            {showFromSelector && (
              <TokenDropdown
                chainSymbol={chain.symbol}
                chainName={chain.name}
                chainLogoUrl={chain.logo_url}
                nativeBalance={nativeBalance}
                tokens={tokens}
                selected={fromToken}
                onSelect={handleSelectFrom}
              />
            )}
          </div>

          {/* Amount input */}
          <div className="flex-1 text-right">
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.0"
              value={fromAmount}
              onChange={(e) => {
                const val = e.target.value;
                if (/^[0-9]*\.?[0-9]*$/.test(val)) setFromAmount(val);
              }}
              className="w-full bg-transparent text-right text-xl font-semibold text-gray-900 placeholder:text-gray-300 focus:outline-none"
            />
            <div className="flex items-center justify-end gap-2">
              <span className="text-xs text-gray-400">{formatUsd(fromAmountUsd)}</span>
              <button
                onClick={handleMaxAmount}
                className="rounded bg-[#E0FAF8] px-1.5 py-0.5 text-xs font-semibold text-[#27CEC5] hover:bg-[#c8f5f1]"
              >
                MAX
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Flip button */}
      <div className="flex justify-center">
        <button
          onClick={handleFlip}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900"
        >
          <ArrowsDownUpIcon className="h-4 w-4" />
        </button>
      </div>

      {/* To */}
      <div className="rounded-xl border border-gray-200 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">You receive</span>
          {isQuoteLoading && <LoadingSpinner size="sm" />}
        </div>

        <div className="flex items-center gap-3">
          {/* Token picker */}
          <div className="relative shrink-0" ref={toSelectorRef}>
            <button
              onClick={() => {
                setShowToSelector(!showToSelector);
                setShowFromSelector(false);
              }}
              className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-200"
            >
              {toLogoUrl ? (
                <img src={toLogoUrl} alt={toSymbol} className="h-5 w-5 rounded-full" />
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-300">
                  <span className="text-xs font-bold">{toSymbol[0]}</span>
                </div>
              )}
              {toSymbol}
              <CaretDownIcon className="h-3.5 w-3.5 text-gray-500" />
            </button>

            {showToSelector && (
              <TokenDropdown
                chainSymbol={chain.symbol}
                chainName={chain.name}
                chainLogoUrl={chain.logo_url}
                nativeBalance={nativeBalance}
                tokens={tokens}
                selected={toToken}
                onSelect={handleSelectTo}
              />
            )}
          </div>

          {/* Output amount (read-only) */}
          <div className="flex-1 text-right">
            <p className="text-xl font-semibold text-[#27CEC5]">
              {isQuoteLoading ? "…" : toAmountFormatted || "0.0"}
            </p>
            <p className="text-xs text-gray-400">{formatUsd(toAmountUsd)}</p>
          </div>
        </div>
      </div>

      {/* Quote info */}
      {quote && !quoteError && (
        <div className="space-y-1.5 rounded-xl bg-gray-50 px-4 py-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Rate</span>
            <span className="text-gray-900">
              1 {fromSymbol} ≈ {parseFloat(exchangeRate).toFixed(6)} {toSymbol}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Slippage</span>
            <div className="flex gap-1">
              {SLIPPAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.bps}
                  onClick={() => setSlippageBps(opt.bps)}
                  className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                    slippageBps === opt.bps
                      ? "bg-[#27CEC5] text-white"
                      : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quote error */}
      {quoteError && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {quoteError}
        </div>
      )}

      {/* Amount exceeds balance warning */}
      {parseFloat(fromAmount) > parseFloat(fromBalance) && fromAmount !== "" && (
        <p className="text-sm text-red-500">Amount exceeds available balance</p>
      )}

      {/* Review button */}
      <LoadingButton
        isLoading={isQuoteLoading}
        loadingText="Getting quote..."
        disabled={!isFormValid}
        onClick={handleReview}
      >
        Review Swap
      </LoadingButton>

      {/* Confirm dialog */}
      {quote && (
        <SwapConfirmDialog
          open={showConfirmDialog}
          onClose={() => setShowConfirmDialog(false)}
          onConfirm={handleSwap}
          isLoading={isApproving || isSwapping}
          loadingText={isApproving ? "Approving token..." : "Swapping..."}
          fromToken={{ symbol: fromSymbol, name: fromName, logo_url: fromLogoUrl }}
          toToken={{ symbol: toSymbol, name: toName, logo_url: toLogoUrl }}
          fromAmount={fromAmount}
          fromAmountUsd={fromAmountUsd}
          toAmount={toAmountFormatted}
          toAmountUsd={toAmountUsd}
          exchangeRate={parseFloat(exchangeRate).toFixed(6)}
          chain={chain}
          slippageBps={slippageBps}
        />
      )}
    </div>
  );
}

// ── Token dropdown ───────────────────────────────────────────────────────────

interface TokenDropdownProps {
  chainSymbol: string;
  chainName: string;
  chainLogoUrl?: string;
  nativeBalance: string;
  tokens: { address: string; symbol: string; name: string; balance: string; logo_url?: string }[];
  selected: SelectedToken;
  onSelect: (token: SelectedToken) => void;
}

function TokenDropdown({
  chainSymbol,
  chainName,
  chainLogoUrl,
  nativeBalance,
  tokens,
  selected,
  onSelect,
}: TokenDropdownProps) {
  return (
    <div className="absolute left-0 top-full z-20 mt-1 max-h-60 w-52 overflow-y-auto rounded-xl bg-white shadow-lg ring-1 ring-black/5">
      {/* Native token */}
      <button
        onClick={() => onSelect("native")}
        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
          selected === "native" ? "bg-[#E0FAF8]" : ""
        }`}
      >
        {chainLogoUrl ? (
          <img src={chainLogoUrl} alt={chainSymbol} className="h-8 w-8 rounded-full" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
            <span className="text-xs font-bold">{chainSymbol[0]}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900">{chainSymbol}</p>
          <p className="truncate text-xs text-gray-400">{chainName}</p>
        </div>
        <p className="shrink-0 text-xs text-gray-500">{nativeBalance}</p>
      </button>

      {/* ERC20 tokens */}
      {tokens.map((token) => (
        <button
          key={token.address}
          onClick={() => onSelect(token.address)}
          className={`flex w-full items-center gap-3 border-t border-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
            selected === token.address ? "bg-[#E0FAF8]" : ""
          }`}
        >
          {token.logo_url ? (
            <img src={token.logo_url} alt={token.symbol} className="h-8 w-8 rounded-full" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
              <span className="text-xs font-bold">{token.symbol[0]}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900">{token.symbol}</p>
            <p className="truncate text-xs text-gray-400">{token.name}</p>
          </div>
          <p className="shrink-0 text-xs text-gray-500">{token.balance}</p>
        </button>
      ))}
    </div>
  );
}

/** Poll for transaction receipt until mined (used after approve tx) */
async function waitForTx(chainId: number, txHash: string): Promise<void> {
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const response = await fetch("/api/rpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chainId,
          method: "eth_getTransactionReceipt",
          params: [txHash],
        }),
      });
      const data = await response.json();
      if (data.result?.status) return;
    } catch {
      // continue polling
    }
  }
  // Don't throw — proceed optimistically even if receipt not found
}
