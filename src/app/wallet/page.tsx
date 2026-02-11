"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useWallets, useExportWallet } from "@privy-io/react-auth";
import { ReceiveModal } from "@/components/wallet";
import { AppShell } from "@/components/layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PageHeader } from "@/components/ui/page-header";
import { PageContent } from "@/components/ui/page-content";
import { ActionCard } from "@/components/ui/action-card";
import { SectionHeader } from "@/components/ui/section-header";
import { SUPPORTED_CHAINS } from "@/types/wallet";
import { useWalletStore } from "@/stores/wallet";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import {
  CopyIcon,
  ArrowSquareOutIcon,
  PaperPlaneTiltIcon,
  ArrowDownLeftIcon,
  ArrowsLeftRightIcon,
  HandCoinsIcon,
  CaretDownIcon,
  CheckIcon,
  CaretLeftIcon
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { formatUsd } from "@/services/token-price";

export default function WalletPage() {
  const { wallets } = useWallets();
  const { exportWallet } = useExportWallet();
  const { isInitialized, isInitializing, error } = useWalletStore();
  const router = useRouter();
  const [selectedChainId, setSelectedChainId] = useState(8453); // Base by default
  const [showChainSelector, setShowChainSelector] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showAllTokens, setShowAllTokens] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);

  const mainnets = SUPPORTED_CHAINS.filter((c) => !c.is_testnet);
  const testnets = SUPPORTED_CHAINS.filter((c) => c.is_testnet);

  // Get embedded wallet
  const embeddedWallet = wallets.find(
    (wallet) => wallet.walletClientType === "privy"
  );

  const selectedChain = SUPPORTED_CHAINS.find(
    (chain) => chain.id === selectedChainId
  );

  // Fetch real token balances from Alchemy
  const { nativeBalance, nativeUsdValue, tokens, isLoading: isBalanceLoading } =
    useTokenBalances(embeddedWallet?.address, selectedChainId);

  const handleCopyAddress = async () => {
    if (!embeddedWallet?.address) return;

    try {
      await navigator.clipboard.writeText(embeddedWallet.address);
      setIsCopied(true);
      toast.success("Address copied!");
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error("Failed to copy address");
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isInitializing || !isInitialized) {
    return (
      <AppShell>
        <PageHeader>
          <div className="flex w-full items-center">
            <button
              onClick={() => router.back()}
              className="absolute left-4 p-1 text-gray-600 hover:text-gray-900"
            >
              <CaretLeftIcon className="h-4 w-4" weight="bold" />
            </button>
            <span className="mx-auto text-sm font-medium text-gray-900">Wallet</span>
          </div>
        </PageHeader>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <PageHeader>
          <div className="flex w-full items-center">
            <button
              onClick={() => router.back()}
              className="absolute left-4 p-1 text-gray-600 hover:text-gray-900"
            >
              <CaretLeftIcon className="h-4 w-4" weight="bold" />
            </button>
            <span className="mx-auto text-sm font-medium text-gray-900">Wallet</span>
          </div>
        </PageHeader>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Header */}
      <PageHeader>
        <div className="flex w-full items-center">
          <button
            onClick={() => router.back()}
            className="absolute left-4 p-1 text-gray-600 hover:text-gray-900"
          >
            <CaretLeftIcon className="h-4 w-4" weight="bold" />
          </button>
          <span className="mx-auto text-sm font-medium text-gray-900">Wallet</span>
        </div>
      </PageHeader>

      <PageContent>
        <div className="p-4">
          {/* Wallet Card */}
          <div className="relative">
            {/* Chain Selector — outside overflow-hidden so dropdown isn't clipped */}
            <div className="absolute left-6 top-6 z-20">
              <button
                onClick={() => setShowChainSelector(!showChainSelector)}
                className="flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-sm text-white backdrop-blur-sm transition-colors hover:bg-white/30"
              >
                {selectedChain?.name}
                <CaretDownIcon className="h-4 w-4" />
              </button>

              {showChainSelector && (
                <div className="absolute left-0 top-full z-30 mt-2 max-h-80 w-52 overflow-y-auto rounded-xl bg-white py-2 shadow-lg">
                  <p className="px-4 py-1 text-xs font-semibold uppercase text-gray-400">Mainnets</p>
                  {mainnets.map((chain) => (
                    <button
                      key={chain.id}
                      onClick={() => {
                        setSelectedChainId(chain.id);
                        setShowChainSelector(false);
                      }}
                      className="flex w-full items-center justify-between px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
                    >
                      <span>{chain.name}</span>
                      {chain.id === selectedChainId && (
                        <CheckIcon className="h-4 w-4 text-[#27CEC5]" />
                      )}
                    </button>
                  ))}
                  <div className="my-1 border-t border-gray-100" />
                  <p className="px-4 py-1 text-xs font-semibold uppercase text-gray-400">Testnets</p>
                  {testnets.map((chain) => (
                    <button
                      key={chain.id}
                      onClick={() => {
                        setSelectedChainId(chain.id);
                        setShowChainSelector(false);
                      }}
                      className="flex w-full items-center justify-between px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
                    >
                      <span>{chain.name}</span>
                      {chain.id === selectedChainId && (
                        <CheckIcon className="h-4 w-4 text-[#27CEC5]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#27CEC5] to-[#1a9e97] p-6 text-white">
              {/* Spacer for chain selector button */}
              <div className="mb-4 h-8" />

              {/* Balance */}
              <div className="mb-6">
                <p className="text-sm text-white/70">Total Balance</p>
                <p className="text-3xl font-bold">
                  {isBalanceLoading ? "..." : nativeBalance} {selectedChain?.symbol}
                </p>
                <p className="text-sm text-white/70">{formatUsd(nativeUsdValue)} USD</p>
              </div>

              {/* Address */}
              {embeddedWallet && (
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-white/20 px-3 py-1 text-sm">
                    {formatAddress(embeddedWallet.address)}
                  </span>
                  <button
                    onClick={handleCopyAddress}
                    className="rounded-full p-1.5 transition-colors hover:bg-white/20"
                  >
                    {isCopied ? (
                      <CheckIcon className="h-4 w-4" />
                    ) : (
                      <CopyIcon className="h-4 w-4" />
                    )}
                  </button>
                  <a
                    href={`${selectedChain?.explorer_url}/address/${embeddedWallet.address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full p-1.5 transition-colors hover:bg-white/20"
                  >
                    <ArrowSquareOutIcon className="h-4 w-4" />
                  </a>
                </div>
              )}

              {/* Decorative circles */}
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
              <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-white/5" />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 grid grid-cols-4 gap-3">
            <ActionCard
              icon={<PaperPlaneTiltIcon className="h-5 w-5 text-[#27CEC5]" />}
              label="Send"
              onClick={() => router.push(`/wallet/send?chainId=${selectedChainId}`)}
            />
            <ActionCard
              icon={<ArrowDownLeftIcon className="h-5 w-5 text-[#27CEC5]" />}
              label="Receive"
              onClick={() => setShowReceiveModal(true)}
            />
            <ActionCard
              icon={<ArrowsLeftRightIcon className="h-5 w-5 text-[#27CEC5]" />}
              label="Swap"
              disabled
            />
            <ActionCard
              icon={<HandCoinsIcon className="h-5 w-5 text-[#27CEC5]" />}
              label="Request"
              disabled
            />
          </div>

          {/* Tokens Section */}
          <div className="mt-6">
            <SectionHeader
              title="Tokens"
              actionLabel={showAllTokens ? "Show Less" : "View All"}
              onAction={tokens.length > 3 ? () => setShowAllTokens(!showAllTokens) : undefined}
            />

            <div className="rounded-2xl bg-white shadow-sm">
              {/* Native Token for selected chain */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                    <span className="text-lg font-bold text-gray-700">
                      {selectedChain?.symbol[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedChain?.symbol}
                    </p>
                    <p className="text-sm text-gray-500">{selectedChain?.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {isBalanceLoading ? "..." : nativeBalance}
                  </p>
                  <p className="text-sm text-gray-500">{formatUsd(nativeUsdValue)}</p>
                </div>
              </div>

              {/* ERC20 tokens on selected chain */}
              {(showAllTokens ? tokens : tokens.slice(0, 3)).map((token) => (
                <div
                  key={token.address}
                  className="flex items-center justify-between border-t border-gray-50 p-4"
                >
                  <div className="flex items-center gap-3">
                    {token.logo_url ? (
                      <Image
                        src={token.logo_url}
                        alt={token.symbol}
                        width={40}
                        height={40}
                        className="rounded-full"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                        <span className="text-lg font-bold text-gray-700">
                          {token.symbol[0]}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{token.symbol}</p>
                      <p className="text-sm text-gray-500">{token.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{token.balance}</p>
                    <p className="text-sm text-gray-500">{formatUsd(token.usd_value)}</p>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isBalanceLoading && (
                <div className="flex items-center justify-center border-t border-gray-50 py-3">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2 text-sm text-gray-400">Loading balances...</span>
                </div>
              )}

              {/* Empty state when no ERC20 tokens */}
              {!isBalanceLoading && tokens.length === 0 && (
                <div className="border-t border-gray-50 py-6 text-center">
                  <p className="text-sm text-gray-400">No other tokens found on {selectedChain?.name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="mt-6">
            <SectionHeader title="Recent Activity" onAction={() => {}} />

            <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
              <p className="text-gray-500">No recent transactions</p>
            </div>
          </div>

          {/* Export Wallet */}
          <div className="mt-6">
            <button
              onClick={exportWallet}
              className="w-full rounded-xl border border-gray-200 py-3 text-center font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Export Wallet
            </button>
          </div>
        </div>

        {/* Receive Modal */}
        {embeddedWallet && selectedChain && (
          <ReceiveModal
            open={showReceiveModal}
            onClose={() => setShowReceiveModal(false)}
            address={embeddedWallet.address}
            chain={selectedChain}
          />
        )}
      </PageContent>
    </AppShell>
  );
}
