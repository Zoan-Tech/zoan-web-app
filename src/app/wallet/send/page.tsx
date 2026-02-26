"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useWallets } from "@privy-io/react-auth";
import Image from "next/image";
import { AppShell } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { PageContent } from "@/components/ui/page-content";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { SendForm } from "@/components/wallet/send-form";
import { useWalletStore } from "@/stores/wallet";
import { useChains } from "@/hooks/use-chains";
import { CaretLeftIcon, CaretDownIcon, CheckIcon } from "@phosphor-icons/react";

function SendPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { wallets } = useWallets();
  const { isInitialized, isInitializing, error } = useWalletStore();

  const initialChainId = Number(searchParams.get("chainId")) || 8453;
  const [selectedChainId, setSelectedChainId] = useState(initialChainId);
  const [showChainSelector, setShowChainSelector] = useState(false);

  const { mainnets, testnets, getChainById } = useChains();
  const chain = getChainById(selectedChainId);

  const embeddedWallet = wallets.find(
    (wallet) => wallet.walletClientType === "privy"
  );

  const header = (
    <div className="relative flex w-full items-center">
      <button
        onClick={() => router.back()}
        className="absolute left-0 p-1 text-gray-600 hover:text-gray-900"
      >
        <CaretLeftIcon className="h-4 w-4" weight="bold" />
      </button>
      <span className="mx-auto text-sm font-medium text-gray-900">Send</span>
    </div>
  );

  if (isInitializing || !isInitialized) {
    return (
      <AppShell>
        <PageHeader>{header}</PageHeader>
        <PageContent>
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-gray-500">Loading wallet...</p>
          </div>
        </PageContent>
      </AppShell>
    );
  }

  if (error || !embeddedWallet || !chain) {
    return (
      <AppShell>
        <PageHeader>{header}</PageHeader>
        <PageContent>
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">
                {error || "Wallet not found"}
              </h2>
              <button
                onClick={() => router.push("/wallet")}
                className="mt-4 text-[#27CEC5] hover:underline"
              >
                Back to Wallet
              </button>
            </div>
          </div>
        </PageContent>

      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader>{header}</PageHeader>
      <PageContent>
        <div className="p-4 space-y-4">
          <div className="relative">
            <button
              onClick={() => setShowChainSelector(!showChainSelector)}
              className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
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
              <CaretDownIcon className="h-3.5 w-3.5 text-gray-400" />
            </button>

            {showChainSelector && (
              <>
                {/* Backdrop to close on outside click */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowChainSelector(false)}
                />
                <div className="absolute left-0 top-full z-20 mt-2 max-h-80 w-52 overflow-y-auto rounded-xl bg-white py-2 shadow-lg ring-1 ring-black/5">
                  <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Mainnets
                  </p>
                  {mainnets.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedChainId(c.id);
                        setShowChainSelector(false);
                      }}
                      className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
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
                      {c.id === selectedChainId && (
                        <CheckIcon className="h-4 w-4 text-[#27CEC5]" />
                      )}
                    </button>
                  ))}
                  <div className="my-1 border-t border-gray-100" />
                  <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Testnets
                  </p>
                  {testnets.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedChainId(c.id);
                        setShowChainSelector(false);
                      }}
                      className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
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
                      {c.id === selectedChainId && (
                        <CheckIcon className="h-4 w-4 text-[#27CEC5]" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Send Form */}
          <SendForm
            address={embeddedWallet.address}
            chainId={selectedChainId}
            chain={chain}
            embeddedWallet={embeddedWallet}
          />
        </div>
      </PageContent>
    </AppShell>
  );
}

export default function SendPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <PageHeader title="Send" />
          <div className="flex min-h-[60vh] items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        </AppShell>
      }
    >
      <SendPageContent />
    </Suspense>
  );
}
