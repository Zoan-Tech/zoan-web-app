"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useWallets } from "@privy-io/react-auth";
import { ReceiveModal, TransactionHistoryModal, SendModal, SwapModal, BridgeModal } from "@/components/wallet";
import { AppShell } from "@/components/layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PageHeader } from "@/components/ui/page-header";
import { PageContent } from "@/components/ui/page-content";
import { useChains } from "@/hooks/use-chains";
import { useWalletStore } from "@/stores/wallet";
import { useTokenBalances } from "@/hooks/use-token-balances";
import {
  ArrowLineUpIcon,
  ArrowLineDownIcon,
  ArrowsLeftRightIcon,
  ArrowsHorizontalIcon,
  BankIcon,
  CheckIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CaretDownIcon,
  ClockCounterClockwiseIcon,
} from "@phosphor-icons/react";
import { formatUsd } from "@/services/token-price";

interface TokenRowProps {
  name: string;
  balance: string;
  symbol: string;
  usdValue: number;
  logoUrl?: string;
  isLoading?: boolean;
}

function TokenRow({ name, balance, symbol, usdValue, logoUrl, isLoading }: TokenRowProps) {
  return (
    <div className="flex items-center justify-between px-4 py-1">
      <div className="flex items-center gap-3">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={name}
            width={44}
            height={44}
            className="rounded-md object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-gray-100">
            <span className="text-base font-bold text-gray-600">{name[0]}</span>
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-gray-900">{name}</p>
          <p className="text-xs text-gray-400">
            {isLoading ? "—" : `${balance} ${symbol}`}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-gray-900">
          {isLoading ? "—" : formatUsd(usdValue)}
        </p>
      </div>
    </div>
  );
}

export default function WalletPage() {
  const { wallets } = useWallets();
  const { isInitialized, isInitializing, error } = useWalletStore();
  const router = useRouter();
  const [selectedChainId, setSelectedChainId] = useState(8453);
  const [showChainSelector, setShowChainSelector] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showBridgeModal, setShowBridgeModal] = useState(false);

  const { mainnets, testnets, getChainById } = useChains();

  const embeddedWallet = wallets.find(
    (wallet) => wallet.walletClientType === "privy"
  );

  const selectedChain = getChainById(selectedChainId);

  const { nativeBalance, nativeUsdValue, tokens, isLoading: isBalanceLoading } =
    useTokenBalances(embeddedWallet?.address, selectedChainId);

  const totalUsdValue =
    nativeUsdValue + tokens.reduce((sum, t) => sum + (t.usd_value || 0), 0);

  const header = (
    <div className="flex w-full items-center">
      <button
        onClick={() => router.back()}
        className="absolute left-4 p-1 text-gray-600 hover:text-gray-900"
      >
        <CaretLeftIcon className="h-4 w-4" weight="bold" />
      </button>
      <span className="mx-auto text-sm font-medium text-gray-900">Wallet</span>
      <button
        onClick={() => setShowHistoryModal(true)}
        className="absolute right-4 p-1 text-gray-600 hover:text-gray-900"
      >
        <ClockCounterClockwiseIcon className="h-5 w-5" weight="bold" />
      </button>
    </div>
  );

  if (isInitializing || !isInitialized || !embeddedWallet) {
    return (
      <AppShell>
        <PageHeader>{header}</PageHeader>
        <PageContent>
          <div className="flex flex-col items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-sm text-gray-500">
              {!isInitialized ? "Initializing wallet..." : "Loading wallet..."}
            </p>
          </div>
        </PageContent>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <PageHeader>{header}</PageHeader>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader>{header}</PageHeader>

      <PageContent>
        <div className="space-y-3 p-4">

          {/* Balance Card */}
          <div className="rounded-2xl">
            <p className="text-xs font-semibold text-gray-900">Total Balance</p>
            <p className="mt-1 text-4xl tracking-tight text-gray-900">
              {isBalanceLoading ? "—" : formatUsd(totalUsdValue)}
            </p>

            <div className="mt-4 flex gap-2">
              {/* Deposit */}
              <button
                onClick={() => setShowReceiveModal(true)}
                className="flex-1 rounded-md bg-gray-900 h-8.75 text-sm font-semibold text-white transition-colors hover:bg-gray-800 hover:cursor-pointer"
              >
                Deposit
              </button>

              {/* Network selector */}
              <div className="relative flex-1">
                <button
                  onClick={() => setShowChainSelector(!showChainSelector)}
                  className="flex w-full h-8.75 items-center justify-center gap-1.5 rounded-md border border-gray-200 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  {selectedChain?.logo_url ? (
                    <Image
                      src={selectedChain.logo_url}
                      alt={selectedChain.name}
                      width={16}
                      height={16}
                      className="rounded"
                      unoptimized
                    />
                  ) : (
                    <div className="h-4 w-4 shrink-0 rounded bg-gray-300" />
                  )}
                  <span>{selectedChain?.name ?? "Network"}</span>
                  <CaretDownIcon className="h-3.5 w-3.5 text-gray-400" />
                </button>

                {showChainSelector && (
                  <div className="absolute right-0 top-full z-30 mt-2 max-h-80 w-52 overflow-y-auto rounded-md bg-white py-2 shadow-lg ring-1 ring-black/5">
                    <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Mainnets
                    </p>
                    {mainnets.map((chain) => (
                      <button
                        key={chain.id}
                        onClick={() => {
                          setSelectedChainId(chain.id);
                          setShowChainSelector(false);
                        }}
                        className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-2">
                          {chain.logo_url ? (
                            <Image
                              src={chain.logo_url}
                              alt={chain.name}
                              width={18}
                              height={18}
                              className="rounded"
                              unoptimized
                            />
                          ) : (
                            <div className="h-4.5 w-4.5 rounded bg-gray-200" />
                          )}
                          <span>{chain.name}</span>
                        </div>
                        {chain.id === selectedChainId && (
                          <CheckIcon className="h-4 w-4 text-[#27CEC5]" />
                        )}
                      </button>
                    ))}
                    <div className="my-1 border-t border-gray-100" />
                    <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Testnets
                    </p>
                    {testnets.map((chain) => (
                      <button
                        key={chain.id}
                        onClick={() => {
                          setSelectedChainId(chain.id);
                          setShowChainSelector(false);
                        }}
                        className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-2">
                          {chain.logo_url ? (
                            <Image
                              src={chain.logo_url}
                              alt={chain.name}
                              width={18}
                              height={18}
                              className="rounded"
                              unoptimized
                            />
                          ) : (
                            <div className="h-4.5 w-4.5 rounded-md bg-gray-200" />
                          )}
                          <span>{chain.name}</span>
                        </div>
                        {chain.id === selectedChainId && (
                          <CheckIcon className="h-4 w-4 text-[#27CEC5]" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl mt-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Quick Actions</h2>
              <CaretRightIcon className="h-4 w-4 text-gray-400" />
            </div>
            <div className="flex justify-center gap-4">
              {[
                {
                  icon: <ArrowLineUpIcon className="h-5 w-5 font-semibold" />,
                  label: "Send",
                  onClick: () => setShowSendModal(true),
                  disabled: false,
                },
                {
                  icon: <ArrowsHorizontalIcon className="h-5 w-5 font-semibold" />,
                  label: "Swap",
                  onClick: () => setShowSwapModal(true),
                  disabled: false,
                },
                {
                  icon: <ArrowsLeftRightIcon className="h-5 w-5 font-semibold" />,
                  label: "Bridge",
                  onClick: () => setShowBridgeModal(true),
                  disabled: false,
                },
                {
                  icon: <BankIcon className="h-5 w-5 font-semibold" />,
                  label: "Request",
                  onClick: undefined,
                  disabled: true,
                },
              ].map(({ icon, label, onClick, disabled }) => (
                <button
                  key={label}
                  onClick={onClick}
                  disabled={disabled}
                  className="flex flex-col items-center gap-1 disabled:opacity-40"
                >
                  <div className="flex w-18.75 h-15 items-center justify-center rounded-md bg-[#F7F9F9F7] text-gray-900 transition-colors hover:bg-primary/20">
                    {icon}
                  </div>
                  <span className="text-xs font-semibold text-gray-900">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Token List */}
          <div className="rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Token</h2>
              <CaretRightIcon className="h-4 w-4 text-gray-400" />
            </div>

            {/* Native token */}
            <TokenRow
              name={selectedChain?.name || ""}
              balance={nativeBalance}
              symbol={selectedChain?.symbol || ""}
              usdValue={nativeUsdValue}
              isLoading={isBalanceLoading}
            />

            {/* ERC20 tokens */}
            {tokens.map((token) => (
              <TokenRow
                key={token.address}
                name={token.name}
                balance={token.balance}
                symbol={token.symbol}
                usdValue={token.usd_value}
                logoUrl={token.logo_url}
              />
            ))}

            {isBalanceLoading && (
              <div className="flex items-center justify-center border-t border-gray-50 py-4">
                <LoadingSpinner size="sm" />
                <span className="ml-2 text-sm text-gray-400">Loading balances...</span>
              </div>
            )}

            {!isBalanceLoading && tokens.length === 0 && (
              <div className="border-t border-gray-50 py-6 text-center">
                <p className="text-sm text-gray-400">
                  No other tokens on {selectedChain?.name}
                </p>
              </div>
            )}
          </div>
        </div>

        {embeddedWallet && selectedChain && (
          <ReceiveModal
            open={showReceiveModal}
            onClose={() => setShowReceiveModal(false)}
            address={embeddedWallet.address}
            chain={selectedChain}
          />
        )}
        {embeddedWallet && selectedChain && (
          <TransactionHistoryModal
            open={showHistoryModal}
            onClose={() => setShowHistoryModal(false)}
            address={embeddedWallet.address}
            chain={selectedChain}
          />
        )}
        <SendModal
          open={showSendModal}
          onClose={() => setShowSendModal(false)}
          initialChainId={selectedChainId}
        />
        <SwapModal
          open={showSwapModal}
          onClose={() => setShowSwapModal(false)}
          initialChainId={selectedChainId}
        />
        <BridgeModal
          open={showBridgeModal}
          onClose={() => setShowBridgeModal(false)}
          initialChainId={selectedChainId}
        />
      </PageContent>
    </AppShell>
  );
}
