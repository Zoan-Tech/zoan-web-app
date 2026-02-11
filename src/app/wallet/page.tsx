"use client";

import { useState } from "react";
import { usePrivy, useWallets, useExportWallet } from "@privy-io/react-auth";
import { AppShell } from "@/components/layout";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PageHeader } from "@/components/ui/page-header";
import { IconButton } from "@/components/ui/icon-button";
import { ActionCard } from "@/components/ui/action-card";
import { SectionHeader } from "@/components/ui/section-header";
import { SUPPORTED_CHAINS } from "@/types/wallet";
import {
  CopyIcon,
  ArrowSquareOutIcon,
  QrCodeIcon,
  PaperPlaneTiltIcon,
  ArrowDownLeftIcon,
  CaretDownIcon,
  CheckIcon,
  ArrowsClockwiseIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";

export default function WalletPage() {
  const { ready, authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const { exportWallet } = useExportWallet();
  const [selectedChainId, setSelectedChainId] = useState(8453); // Base by default
  const [showChainSelector, setShowChainSelector] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Get embedded wallet
  const embeddedWallet = wallets.find(
    (wallet) => wallet.walletClientType === "privy"
  );

  const selectedChain = SUPPORTED_CHAINS.find(
    (chain) => chain.id === selectedChainId
  );

  const handleCopyAddress = async () => {
    if (!embeddedWallet?.address) return;
    
    try {
      await navigator.clipboard.writeText(embeddedWallet.address);
      setIsCopied(true);
      toast.success("Address copied!");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy address");
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!ready) {
    return (
      <AppShell>
        <LoadingSpinner size="lg" fullScreen />
      </AppShell>
    );
  }

  if (!authenticated) {
    return (
      <AppShell>
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E0FAF8]">
              <svg
                className="h-8 w-8 text-[#27CEC5]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Connect Your Wallet
            </h2>
            <p className="mt-2 text-gray-500">
              Sign in to access your wallet and manage your assets
            </p>
          </div>
          <button
            onClick={login}
            className="rounded-full bg-[#27CEC5] px-6 py-3 font-medium text-white transition-colors hover:bg-[#20b5ad]"
          >
            Connect Wallet
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Header */}
      <PageHeader
        title="Wallet"
        actions={
          <IconButton>
            <ArrowsClockwiseIcon className="h-5 w-5" />
          </IconButton>
        }
      />

      <div className="p-4">
        {/* Wallet Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#27CEC5] to-[#1a9e97] p-6 text-white">
          {/* Chain Selector */}
          <div className="relative mb-4">
            <button
              onClick={() => setShowChainSelector(!showChainSelector)}
              className="flex items-center gap-2 rounded-full bg-white/20 px-3 py-1.5 text-sm backdrop-blur-sm transition-colors hover:bg-white/30"
            >
              {selectedChain?.name}
              <CaretDownIcon className="h-4 w-4" />
            </button>

            {showChainSelector && (
              <div className="absolute left-0 top-full z-10 mt-2 w-48 rounded-xl bg-white py-2 shadow-lg">
                {SUPPORTED_CHAINS.filter((c) => !c.is_testnet).map((chain) => (
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

          {/* Balance */}
          <div className="mb-6">
            <p className="text-sm text-white/70">Total Balance</p>
            <p className="text-3xl font-bold">0.00 {selectedChain?.symbol}</p>
            <p className="text-sm text-white/70">$0.00 USD</p>
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

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <ActionCard
            icon={<PaperPlaneTiltIcon className="h-5 w-5 text-[#27CEC5]" />}
            label="Send"
          />
          <ActionCard
            icon={<ArrowDownLeftIcon className="h-5 w-5 text-[#27CEC5]" />}
            label="Receive"
          />
          <ActionCard
            icon={<QrCodeIcon className="h-5 w-5 text-[#27CEC5]" />}
            label="QR Code"
          />
        </div>

        {/* Tokens Section */}
        <div className="mt-6">
          <SectionHeader title="Tokens" onAction={() => {}} />

          <div className="rounded-2xl bg-white shadow-sm">
            {/* Native Token */}
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
                <p className="font-medium text-gray-900">0.00</p>
                <p className="text-sm text-gray-500">$0.00</p>
              </div>
            </div>
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
    </AppShell>
  );
}
