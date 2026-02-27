"use client";

import { useState, useRef, useEffect } from "react";
import { useTokenBalances } from "@/hooks/use-token-balances";
import { useGasEstimation, type GasEstimation } from "@/hooks/use-gas-estimation";
import { encodeErc20Transfer, parseTokenAmount } from "@/lib/wallet/erc20";
import { formatUsd } from "@/services/token-price";
import { FormInput } from "@/components/ui/form-input";
import { LoadingButton } from "@/components/ui/loading-button";
import { TransactionConfirmDialog } from "../transaction-confirm-dialog";
import type { Chain } from "@/types/wallet";
import { CaretDownIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import Image from "next/image";

interface SendFormProps {
  address: string;
  chainId: number;
  chain: Chain;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  embeddedWallet: any;
  onClose?: () => void;
}

type SelectedToken = "native" | string; // "native" or ERC20 contract address

function validateAddress(addr: string): string | null {
  if (!addr) return "Address is required";
  if (!addr.startsWith("0x")) return "Must start with 0x";
  if (addr.length !== 42) return "Must be 42 characters";
  if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) return "Invalid hex characters";
  return null;
}

function validateAmount(
  amount: string,
  maxBalance: string
): string | null {
  if (!amount || amount === "0") return "Amount is required";
  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) return "Must be greater than 0";
  if (num > parseFloat(maxBalance)) return "Exceeds available balance";
  return null;
}

export function SendForm({
  address,
  chainId,
  chain,
  embeddedWallet,
  onClose,
}: SendFormProps) {
  const { nativeBalance, nativeUsdPrice, tokens } =
    useTokenBalances(address, chainId);
  const { estimate, isEstimating } = useGasEstimation();

  const [selectedToken, setSelectedToken] = useState<SelectedToken>("native");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [gasEstimation, setGasEstimation] = useState<GasEstimation | null>(
    null
  );

  const tokenSelectorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showTokenSelector) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (tokenSelectorRef.current && !tokenSelectorRef.current.contains(e.target as Node)) {
        setShowTokenSelector(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showTokenSelector]);

  // Get current token info
  const isNative = selectedToken === "native";
  const currentErc20 = !isNative
    ? tokens.find((t) => t.address.toLowerCase() === selectedToken.toLowerCase())
    : null;

  const currentBalance = isNative
    ? nativeBalance
    : currentErc20?.balance ?? "0";
  const currentSymbol = isNative ? chain.symbol : currentErc20?.symbol ?? "???";
  const currentDecimals = isNative ? 18 : currentErc20?.decimals ?? 18;
  const currentUsdPrice = isNative
    ? nativeUsdPrice
    : currentErc20?.usd_price ?? 0;

  const amountUsd = currentUsdPrice * (parseFloat(amount) || 0);

  const handleMaxAmount = () => {
    setAmount(currentBalance);
    setAmountError(null);
  };

  const handleSelectToken = (token: SelectedToken) => {
    setSelectedToken(token);
    setAmount("");
    setAmountError(null);
    setShowTokenSelector(false);
  };

  const handleReview = async () => {
    // Validate
    const addrErr = validateAddress(recipientAddress);
    const amtErr = validateAmount(amount, currentBalance);
    setAddressError(addrErr);
    setAmountError(amtErr);
    if (addrErr || amtErr) return;

    // Build tx object for gas estimation
    let to: string;
    let value: string | undefined;
    let data: string | undefined;

    if (isNative) {
      to = recipientAddress;
      value = "0x" + parseTokenAmount(amount, 18).toString(16);
    } else {
      to = selectedToken; // contract address
      value = "0x0";
      data = encodeErc20Transfer(
        recipientAddress,
        parseTokenAmount(amount, currentDecimals)
      );
    }

    const result = await estimate({
      chainId,
      from: address,
      to,
      value,
      data,
      nativeUsdPrice,
    });

    if (result) {
      setGasEstimation(result);
      setShowConfirmDialog(true);
    }
  };

  const handleSend = async () => {
    setIsSending(true);
    try {
      const provider = await embeddedWallet.getEthereumProvider();

      // Switch chain
      try {
        await provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x" + chainId.toString(16) }],
        });
      } catch {
        // Chain might already be selected or not need switching
      }

      let txParams: { from: string; to: string; value: string; data?: string };

      if (isNative) {
        txParams = {
          from: address,
          to: recipientAddress,
          value: "0x" + parseTokenAmount(amount, 18).toString(16),
        };
      } else {
        const data = encodeErc20Transfer(
          recipientAddress,
          parseTokenAmount(amount, currentDecimals)
        );
        txParams = {
          from: address,
          to: selectedToken,
          value: "0x0",
          data,
        };
      }

      const txHash = await provider.request({
        method: "eth_sendTransaction",
        params: [txParams],
      });

      toast.success("Transaction sent!", {
        description: `TX: ${(txHash as string).slice(0, 10)}...`,
        action: {
          label: "View",
          onClick: () =>
            window.open(
              `${chain.explorer_url}/tx/${txHash}`,
              "_blank"
            ),
        },
      });

      onClose?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      toast.error("Transaction failed", { description: message });
    } finally {
      setIsSending(false);
      setShowConfirmDialog(false);
    }
  };

  const isFormValid =
    recipientAddress.length > 0 && amount.length > 0 && !addressError && !amountError;

  return (
    <div className="space-y-5">
      {/* Asset Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Asset
        </label>
        <div className="relative mt-1" ref={tokenSelectorRef}>
          <button
            onClick={() => setShowTokenSelector(!showTokenSelector)}
            className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-left transition-colors hover:border-gray-300"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                <span className="text-sm font-bold text-gray-700">
                  {currentSymbol[0]}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{currentSymbol}</p>
                <p className="text-xs text-gray-500">
                  Balance: {currentBalance}
                </p>
              </div>
            </div>
            <CaretDownIcon className="h-4 w-4 text-gray-400" />
          </button>

          {showTokenSelector && (
            <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-60 overflow-y-auto rounded-xl bg-white shadow-lg">
              {/* Native token */}
              <button
                onClick={() => handleSelectToken("native")}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                  <span className="text-sm font-bold text-gray-700">
                    {chain.symbol[0]}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{chain.symbol}</p>
                  <p className="text-xs text-gray-500">{chain.name}</p>
                </div>
                <p className="text-sm text-gray-500">{nativeBalance}</p>
              </button>

              {/* ERC20 tokens */}
              {tokens.map((token) => (
                <button
                  key={token.address}
                  onClick={() => handleSelectToken(token.address)}
                  className="flex w-full items-center gap-3 border-t border-gray-50 px-4 py-3 text-left hover:bg-gray-50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                    {token.logo_url ? (
                      <Image
                        src={token.logo_url}
                        alt={token.symbol}
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <span className="text-sm font-bold text-gray-700">
                        {token.symbol[0]}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{token.symbol}</p>
                    <p className="text-xs text-gray-500">{token.name}</p>
                  </div>
                  <p className="text-sm text-gray-500">{token.balance}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recipient Address */}
      <FormInput
        label="Recipient Address"
        placeholder="0x..."
        value={recipientAddress}
        onChange={(e) => {
          setRecipientAddress(e.target.value);
          if (addressError) setAddressError(null);
        }}
        onBlur={() => {
          if (recipientAddress) {
            setAddressError(validateAddress(recipientAddress));
          }
        }}
        error={addressError ?? undefined}
      />

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Amount
        </label>
        <div className="relative mt-1">
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.0"
            value={amount}
            onChange={(e) => {
              const val = e.target.value;
              // Allow only numbers and one decimal point
              if (/^[0-9]*\.?[0-9]*$/.test(val)) {
                setAmount(val);
                if (amountError) setAmountError(null);
              }
            }}
            onBlur={() => {
              if (amount) {
                setAmountError(validateAmount(amount, currentBalance));
              }
            }}
            className="w-full rounded-lg border border-gray-200 px-4 py-3 pr-16 text-gray-900 placeholder:text-gray-400 focus:border-[#27CEC5] focus:outline-none focus:ring-2 focus:ring-[#27CEC5]/20"
          />
          <button
            onClick={handleMaxAmount}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md bg-[#E0FAF8] px-2 py-1 text-xs font-semibold text-[#27CEC5] transition-colors hover:bg-[#c8f5f1]"
          >
            MAX
          </button>
        </div>
        {amountError && (
          <p className="mt-1 text-sm text-red-500">{amountError}</p>
        )}
        <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
          <span>{formatUsd(amountUsd)}</span>
          <span>
            Available: {currentBalance} {currentSymbol}
          </span>
        </div>
      </div>

      {/* Review Button */}
      <LoadingButton
        isLoading={isEstimating}
        loadingText="Estimating gas..."
        disabled={!isFormValid}
        onClick={handleReview}
      >
        Review
      </LoadingButton>

      {/* Confirm Dialog */}
      {gasEstimation && (
        <TransactionConfirmDialog
          open={showConfirmDialog}
          onClose={() => setShowConfirmDialog(false)}
          onConfirm={handleSend}
          isLoading={isSending}
          token={{
            symbol: currentSymbol,
            name: isNative ? chain.name : currentErc20?.name ?? "",
            logo_url: currentErc20?.logo_url,
          }}
          amount={amount}
          amountUsd={amountUsd}
          recipient={recipientAddress}
          chain={chain}
          gasEstimation={gasEstimation}
          payWithAddress={address}
          payWithBalance={nativeBalance}
        />
      )}
    </div>
  );
}
