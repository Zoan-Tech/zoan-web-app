"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useWallets } from "@privy-io/react-auth";
import { AppShell } from "@/components/layout";
import { PageHeader } from "@/components/ui/page-header";
import { IconButton } from "@/components/ui/icon-button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { SendForm } from "@/components/wallet/send-form";
import { useWalletStore } from "@/stores/wallet";
import { SUPPORTED_CHAINS } from "@/types/wallet";
import { ArrowLeftIcon } from "@phosphor-icons/react";

function SendPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { wallets } = useWallets();
  const { isInitialized, isInitializing, error } = useWalletStore();

  const chainId = Number(searchParams.get("chainId")) || 8453;
  const chain = SUPPORTED_CHAINS.find((c) => c.id === chainId);

  const embeddedWallet = wallets.find(
    (wallet) => wallet.walletClientType === "privy"
  );

  if (isInitializing || !isInitialized) {
    return (
      <AppShell>
        <PageHeader
          title="Send"
          actions={
            <IconButton onClick={() => router.push("/wallet")}>
              <ArrowLeftIcon className="h-5 w-5" />
            </IconButton>
          }
        />
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-500">Loading wallet...</p>
        </div>
      </AppShell>
    );
  }

  if (error || !embeddedWallet || !chain) {
    return (
      <AppShell>
        <PageHeader
          title="Send"
          actions={
            <IconButton onClick={() => router.push("/wallet")}>
              <ArrowLeftIcon className="h-5 w-5" />
            </IconButton>
          }
        />
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
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Send"
        actions={
          <IconButton onClick={() => router.push("/wallet")}>
            <ArrowLeftIcon className="h-5 w-5" />
          </IconButton>
        }
      />
      <div className="p-4">
        <SendForm
          address={embeddedWallet.address}
          chainId={chainId}
          chain={chain}
          embeddedWallet={embeddedWallet}
        />
      </div>
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
