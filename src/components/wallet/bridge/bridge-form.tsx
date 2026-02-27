"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useTokenBalances } from "@/hooks/use-token-balances";
import { useBridgeQuote } from "@/hooks/use-bridge-quote";
import { isBridgeSupported, getTotalFeeUsd, getOrbiterChains, ORBITER_NATIVE_TOKEN } from "@/services/bridge";
import { formatUsd } from "@/services/token-price";
import { checkAllowance, encodeApproval } from "@/services/swap";
import { LoadingButton } from "@/components/ui/loading-button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { BridgeConfirmDialog } from "./bridge-confirm-dialog";
import type { Chain } from "@/types/wallet";
import {
  CaretDownIcon,
  CheckIcon,
  WarningCircleIcon,
  ClockIcon,
  ArrowsDownUpIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";

interface BridgeFormProps {
  address: string;
  sourceChain: Chain;
  destChain: Chain;
  allChains: Chain[];
  onSourceChainChange: (chainId: number) => void;
  onDestChainChange: (chainId: number) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  embeddedWallet: any;
  onClose?: () => void;
}

type SelectedToken = "native" | string;

export function BridgeForm({
  address,
  sourceChain,
  destChain,
  allChains,
  onSourceChainChange,
  onDestChainChange,
  embeddedWallet,
  onClose,
}: BridgeFormProps) {
  const { nativeBalance, nativeUsdPrice, tokens } = useTokenBalances(address, sourceChain.id);

  // Fetch Orbiter chain metadata to get correct native token addresses per chain
  const { data: orbiterChains } = useQuery({
    queryKey: ["orbiterChains"],
    queryFn: getOrbiterChains,
    staleTime: Infinity,
  });
  const getOrbiterNative = (chainId: number) =>
    orbiterChains?.find((c) => c.chainId === String(chainId))?.nativeCurrency.address
    ?? ORBITER_NATIVE_TOKEN;

  const [selectedToken, setSelectedToken] = useState<SelectedToken>("native");
  const [amount, setAmount] = useState("");
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [showSourceChainSelector, setShowSourceChainSelector] = useState(false);
  const [showDestChainSelector, setShowDestChainSelector] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isBridging, setIsBridging] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [bridgeTxHash, setBridgeTxHash] = useState<string | null>(null);

  const tokenSelectorRef = useRef<HTMLDivElement>(null);
  const sourceChainSelectorRef = useRef<HTMLDivElement>(null);
  const destChainSelectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showTokenSelector && !showSourceChainSelector && !showDestChainSelector) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (showTokenSelector && tokenSelectorRef.current && !tokenSelectorRef.current.contains(e.target as Node)) {
        setShowTokenSelector(false);
      }
      if (showSourceChainSelector && sourceChainSelectorRef.current && !sourceChainSelectorRef.current.contains(e.target as Node)) {
        setShowSourceChainSelector(false);
      }
      if (showDestChainSelector && destChainSelectorRef.current && !destChainSelectorRef.current.contains(e.target as Node)) {
        setShowDestChainSelector(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showTokenSelector, showSourceChainSelector, showDestChainSelector]);

  // Reset token when source chain changes
  useEffect(() => {
    setSelectedToken("native");
    setAmount("");
  }, [sourceChain.id]);

  const isNative = selectedToken === "native";
  const selectedErc20 = !isNative
    ? tokens.find((t) => t.address.toLowerCase() === selectedToken.toLowerCase())
    : null;

  const tokenSymbol = isNative ? sourceChain.symbol : selectedErc20?.symbol ?? "???";
  const tokenName = isNative ? sourceChain.name : selectedErc20?.name ?? "Unknown";
  const tokenLogoUrl = isNative ? sourceChain.logo_url : selectedErc20?.logo_url;
  const tokenBalance = isNative ? nativeBalance : selectedErc20?.balance ?? "0";
  const tokenUsdPrice = isNative ? nativeUsdPrice : 0;
  const amountUsd = tokenUsdPrice * (parseFloat(amount) || 0);

  // Token address for quote — use Orbiter's chain-specific native address
  const sourceTokenAddress = isNative ? getOrbiterNative(sourceChain.id) : selectedToken;
  // Assume bridging same token on destination (e.g. ETH → ETH, USDC → USDC)
  const destTokenAddress = getOrbiterNative(destChain.id);

  const tokenDecimals = isNative ? 18 : (selectedErc20?.decimals ?? 18);

  const { quote, isLoading: isQuoteLoading, error: quoteError } = useBridgeQuote({
    sourceChainId: sourceChain.id,
    destChainId: destChain.id,
    sourceToken: sourceTokenAddress,
    destToken: destTokenAddress,
    amount,
    decimals: tokenDecimals,
    userAddress: address,
    enabled: isBridgeSupported(sourceChain.id) && isBridgeSupported(destChain.id),
  });

  const receiveAmount = quote?.details.destAmountFormatted ?? "";
  const feeUsd = quote ? getTotalFeeUsd(quote.fees) : 0;

  const handleMaxAmount = () => setAmount(tokenBalance);

  const handleReview = () => {
    if (!quote) return;
    setShowConfirmDialog(true);
  };

  const handleBridge = async () => {
    if (!quote || !quote.steps.length) return;

    setIsBridging(true);
    try {
      const provider = await embeddedWallet.getEthereumProvider();

      // Switch to source chain
      try {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x" + sourceChain.id.toString(16) }],
        });
      } catch {
        // Already on correct chain
      }

      let submittedTxHash: string | null = null;

      // Execute each step in sequence
      for (const step of quote.steps) {
        const isApprovalStep =
          step.action === "approve" ||
          (!isNative && step.tx.data && step.tx.data !== "0x" && step.tx.data.startsWith("0x095ea7b3"));

        if (isApprovalStep) {
          setIsApproving(true);
          try {
            const currentAllowance = await checkAllowance(
              sourceChain.id,
              selectedToken,
              address,
              step.tx.to
            );
            const requiredAmount = BigInt(step.tx.value || "0");
            if (currentAllowance < requiredAmount) {
              const approveData = encodeApproval(step.tx.to);
              toast.loading("Approving token...", { id: "bridge-approve" });
              const approveTxHash = await provider.request({
                method: "eth_sendTransaction",
                params: [{ from: address, to: selectedToken, value: "0x0", data: approveData }],
              });
              await waitForTx(sourceChain.id, approveTxHash as string);
              toast.success("Token approved!", { id: "bridge-approve" });
            }
          } finally {
            setIsApproving(false);
          }
          continue;
        }

        // Any non-approval step with a destination is treated as the bridge tx
        if (step.tx.to) {
          toast.loading("Submitting bridge transaction...", { id: "bridge-tx" });
          // value comes as decimal wei string — eth_sendTransaction requires hex
          const valueHex = "0x" + BigInt(step.tx.value || "0").toString(16);
          const txHash = await provider.request({
            method: "eth_sendTransaction",
            params: [{
              from: address,
              to: step.tx.to,
              value: valueHex,
              data: step.tx.data || "0x",
            }],
          });
          submittedTxHash = txHash as string;
          toast.dismiss("bridge-tx");
        }
      }

      if (submittedTxHash) {
        setBridgeTxHash(submittedTxHash);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.dismiss("bridge-tx");
      toast.error("Bridge failed", { description: message });
      setShowConfirmDialog(false);
    } finally {
      setIsBridging(false);
    }
  };

  const sourceChainOptions = allChains.filter(
    (c) => c.id !== destChain.id && isBridgeSupported(c.id) && !c.is_testnet
  );
  const destChainOptions = allChains.filter(
    (c) => c.id !== sourceChain.id && isBridgeSupported(c.id) && !c.is_testnet
  );

  const isFormValid =
    isBridgeSupported(sourceChain.id) &&
    isBridgeSupported(destChain.id) &&
    sourceChain.id !== destChain.id &&
    parseFloat(amount) > 0 &&
    parseFloat(amount) <= parseFloat(tokenBalance) &&
    !!quote &&
    !isQuoteLoading;

  if (!isBridgeSupported(sourceChain.id)) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-gray-50 p-8 text-center">
        <WarningCircleIcon className="h-10 w-10 text-amber-400" />
        <div>
          <p className="font-semibold text-gray-900">Bridge from {sourceChain.name}</p>
          <p className="mt-1 text-sm text-gray-500">
            Bridge from {sourceChain.name} is not yet supported. Try a different network.
          </p>
        </div>
        <button
          onClick={() => onClose?.()}
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
      <div className="flex flex-col gap-2">
        <div className="rounded-xl border border-gray-200 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">From</span>

            {/* Source chain selector */}
            <div className="relative" ref={sourceChainSelectorRef}>
              <button
                onClick={() => {
                  setShowSourceChainSelector(!showSourceChainSelector);
                  setShowDestChainSelector(false);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                {sourceChain.logo_url && (
                  <Image
                    src={sourceChain.logo_url}
                    alt={sourceChain.name}
                    width={14}
                    height={14}
                    className="rounded"
                    unoptimized
                  />
                )}
                {sourceChain.name}
                <CaretDownIcon className="h-3 w-3 text-gray-400" />
              </button>

              {showSourceChainSelector && (
                <div className="absolute right-0 top-full z-20 mt-1 max-h-60 w-52 overflow-y-auto rounded-xl bg-white shadow-lg ring-1 ring-black/5">
                  {sourceChainOptions.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-gray-500">No supported chains available</p>
                  ) : (
                    sourceChainOptions.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          onSourceChainChange(c.id);
                          setShowSourceChainSelector(false);
                        }}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-2">
                          {c.logo_url ? (
                            <Image
                              src={c.logo_url}
                              alt={c.name}
                              width={18}
                              height={18}
                              className="rounded"
                              unoptimized
                            />
                          ) : (
                            <div className="h-4.5 w-4.5 rounded bg-gray-200" />
                          )}
                          <span>{c.name}</span>
                        </div>
                        {c.id === sourceChain.id && (
                          <CheckIcon className="h-4 w-4 text-[#27CEC5]" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Token selector */}
            <div className="relative shrink-0" ref={tokenSelectorRef}>
              <button
                onClick={() => setShowTokenSelector(!showTokenSelector)}
                className="flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-200"
              >
                {tokenLogoUrl ? (
                  <Image src={tokenLogoUrl} alt={tokenSymbol} width={20} height={20} className="h-5 w-5 rounded" unoptimized />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-gray-300">
                    <span className="text-xs font-bold">{tokenSymbol[0]}</span>
                  </div>
                )}
                {tokenSymbol}
                <CaretDownIcon className="h-3.5 w-3.5 text-gray-500" />
              </button>

              {showTokenSelector && (
                <TokenDropdown
                  chainSymbol={sourceChain.symbol}
                  chainName={sourceChain.name}
                  chainLogoUrl={sourceChain.logo_url}
                  nativeBalance={nativeBalance}
                  tokens={tokens}
                  selected={selectedToken}
                  onSelect={(token) => {
                    setSelectedToken(token);
                    setAmount("");
                    setShowTokenSelector(false);
                  }}
                />
              )}
            </div>

            {/* Amount input */}
            <div className="flex-1 text-right">
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.0"
                value={amount}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^[0-9]*\.?[0-9]*$/.test(val)) setAmount(val);
                }}
                className="w-full bg-transparent text-right text-xl font-semibold text-gray-900 placeholder:text-gray-300 focus:outline-none"
              />
              <div className="flex items-center justify-end gap-2">
                <span className="text-xs text-gray-400">
                  Balance: {tokenBalance} {tokenSymbol}
                </span>
                <button
                  onClick={handleMaxAmount}
                  className="rounded bg-[#E0FAF8] px-1.5 py-0.5 text-xs font-semibold text-[#27CEC5] hover:bg-[#c8f5f1]"
                >
                  MAX
                </button>
              </div>
              {amountUsd > 0 && (
                <p className="mt-0.5 text-xs text-gray-400">{formatUsd(amountUsd)}</p>
              )}
            </div>
          </div>
        </div>

      {/* Switch chains */}
      <div className="relative z-10 -my-4.5 flex justify-center">
        <button
          onClick={() => {
            const prevSource = sourceChain.id;
            const prevDest = destChain.id;
            onSourceChainChange(prevDest);
            onDestChainChange(prevSource);
          }}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900"
          title="Switch chains"
        >
          <ArrowsDownUpIcon className="h-4 w-4" />
        </button>
      </div>

      {/* To */}
      <div className="rounded-xl border border-gray-200 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">To</span>

          {/* Destination chain selector */}
          <div className="relative" ref={destChainSelectorRef}>
            <button
              onClick={() => {
                setShowDestChainSelector(!showDestChainSelector);
                setShowSourceChainSelector(false);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
            >
              {destChain.logo_url && (
                <Image
                  src={destChain.logo_url}
                  alt={destChain.name}
                  width={14}
                  height={14}
                  className="rounded"
                  unoptimized
                />
              )}
              {destChain.name}
              <CaretDownIcon className="h-3 w-3 text-gray-400" />
            </button>

            {showDestChainSelector && (
              <div className="absolute right-0 top-full z-20 mt-1 max-h-60 w-52 overflow-y-auto rounded-xl bg-white shadow-lg ring-1 ring-black/5">
                {destChainOptions.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-500">No supported chains available</p>
                ) : (
                  destChainOptions.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        onDestChainChange(c.id);
                        setShowDestChainSelector(false);
                      }}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        {c.logo_url ? (
                          <Image
                            src={c.logo_url}
                            alt={c.name}
                            width={18}
                            height={18}
                            className="rounded"
                            unoptimized
                          />
                        ) : (
                          <div className="h-4.5 w-4.5 rounded bg-gray-200" />
                        )}
                        <span>{c.name}</span>
                      </div>
                      {c.id === destChain.id && (
                        <CheckIcon className="h-4 w-4 text-[#27CEC5]" />
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Destination token (same symbol, read-only) */}
          <div className="flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2">
            {destChain.logo_url ? (
              <Image src={destChain.logo_url} alt={destChain.symbol} width={20} height={20} className="h-5 w-5 rounded" unoptimized />
            ) : (
              <div className="flex h-5 w-5 items-center justify-center rounded bg-gray-300">
                <span className="text-xs font-bold">{destChain.symbol[0]}</span>
              </div>
            )}
            <span className="text-sm font-medium text-gray-900">{destChain.symbol}</span>
          </div>

          {/* Receive amount */}
          <div className="flex-1 text-right">
            <p className="text-xl font-semibold text-[#27CEC5]">
              {isQuoteLoading ? "…" : receiveAmount || "0.0"}
            </p>
            {isQuoteLoading && (
              <div className="flex justify-end mt-1">
                <LoadingSpinner size="sm" />
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Quote info */}
      {quote && !quoteError && (
        <div className="space-y-2 rounded-xl bg-gray-50 px-4 py-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Bridge fee</span>
            <span className="text-gray-900">
              {feeUsd > 0 ? formatUsd(feeUsd) : "Included"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">You receive</span>
            <span className="font-medium text-[#27CEC5]">
              ≈ {receiveAmount} {destChain.symbol}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <ClockIcon className="h-3.5 w-3.5" />
            <span>Estimated time: ~2-5 minutes</span>
          </div>
        </div>
      )}

      {/* Errors */}
      {quoteError && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {quoteError}
        </div>
      )}

      {parseFloat(amount) > parseFloat(tokenBalance) && amount !== "" && (
        <p className="text-sm text-red-500">Amount exceeds available balance</p>
      )}

      {/* Bridge button */}
      <LoadingButton
        isLoading={isQuoteLoading}
        loadingText="Getting quote..."
        disabled={!isFormValid}
        onClick={handleReview}
      >
        Review Bridge
      </LoadingButton>

      {/* Confirm dialog */}
      {quote && (
        <BridgeConfirmDialog
          open={showConfirmDialog}
          onClose={() => {
            setShowConfirmDialog(false);
            setBridgeTxHash(null);
          }}
          onConfirm={handleBridge}
          isLoading={isApproving || isBridging}
          loadingText={isApproving ? "Approving token..." : "Bridging..."}
          token={{ symbol: tokenSymbol, name: tokenName, logo_url: tokenLogoUrl }}
          amount={amount}
          amountUsd={amountUsd}
          receiveAmount={receiveAmount}
          receiveSymbol={destChain.symbol}
          sourceChain={sourceChain}
          destChain={destChain}
          feeUsd={feeUsd}
          txHash={bridgeTxHash}
          explorerUrl={bridgeTxHash ? `${sourceChain.explorer_url}/tx/${bridgeTxHash}` : undefined}
        />
      )}
    </div>
  );
}

// ── Token dropdown ──────────────────────────────────────────────────────────

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
      <button
        onClick={() => onSelect("native")}
        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
          selected === "native" ? "bg-[#E0FAF8]" : ""
        }`}
      >
        {chainLogoUrl ? (
          <Image src={chainLogoUrl} alt={chainSymbol} width={32} height={32} className="h-8 w-8 rounded-xl" unoptimized />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-200">
            <span className="text-xs font-bold">{chainSymbol[0]}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900">{chainSymbol}</p>
          <p className="truncate text-xs text-gray-400">{chainName}</p>
        </div>
        <p className="shrink-0 text-xs text-gray-500">{nativeBalance}</p>
      </button>

      {tokens.map((token) => (
        <button
          key={token.address}
          onClick={() => onSelect(token.address)}
          className={`flex w-full items-center gap-3 border-t border-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
            selected === token.address ? "bg-[#E0FAF8]" : ""
          }`}
        >
          {token.logo_url ? (
            <Image src={token.logo_url} alt={token.symbol} width={32} height={32} className="h-8 w-8 rounded-xl" unoptimized />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-200">
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

/** Poll for transaction receipt until included */
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
}
