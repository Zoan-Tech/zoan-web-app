"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePrivy, useWallets, useCreateWallet } from "@privy-io/react-auth";
import { useWalletStore } from "@/stores/wallet";
import { walletService } from "@/services/wallet";

export function useWalletInit() {
  const { user: privyUser, authenticated: privyAuthenticated, ready } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const { createWallet } = useCreateWallet();
  const {
    isInitialized,
    isInitializing,
    setWallet,
    setInitializing,
    setError,
  } = useWalletStore();

  const hasStoredRef = useRef(false);
  const isCreatingRef = useRef(false);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;

  const storeWalletToBackend = useCallback(
    async (address: string, privyDid: string) => {
      if (hasStoredRef.current) return;
      if (retryCountRef.current >= MAX_RETRIES) {
        console.warn("[WalletInit] Max retries reached for storeWallet");
        setError("Failed to store wallet after multiple attempts");
        return;
      }
      hasStoredRef.current = true;
      retryCountRef.current += 1;

      try {
        await walletService.storeWallet(address, privyDid);
        setWallet(address, privyDid);
        console.log("[WalletInit] Wallet stored:", address);
      } catch (error) {
        hasStoredRef.current = false;
        console.error("[WalletInit] Failed to store wallet:", error);
        setError("Failed to store wallet to backend");
      }
    },
    [setWallet, setError]
  );

  // When Privy is authenticated and wallets are loaded, create if needed and store
  useEffect(() => {
    if (!ready || !walletsReady || !privyAuthenticated || !privyUser || isInitialized || hasStoredRef.current) return;

    const embeddedWallet = wallets.find(
      (w) => w.walletClientType === "privy"
    );

    if (embeddedWallet) {
      // Wallet exists, store to backend
      storeWalletToBackend(embeddedWallet.address, privyUser.id);
    } else if (!isInitializing && !isCreatingRef.current) {
      // No embedded wallet found after wallets are ready, create one
      isCreatingRef.current = true;
      setInitializing(true);
      createWallet()
        .then(() => {
          console.log("[WalletInit] Wallet created");
          // The wallet will appear in the wallets array on next render
        })
        .catch((err: Error) => {
          // "User already has an embedded wallet" means it's loading — just wait
          if (err.message?.includes("already has")) {
            console.log("[WalletInit] Wallet already exists, waiting for it to load...");
          } else {
            console.error("[WalletInit] Failed to create wallet:", err);
            setError("Failed to create wallet");
          }
        })
        .finally(() => {
          isCreatingRef.current = false;
        });
    }
  }, [
    ready,
    walletsReady,
    privyAuthenticated,
    privyUser,
    wallets,
    isInitialized,
    isInitializing,
    setInitializing,
    setError,
    createWallet,
    storeWalletToBackend,
  ]);

  const reset = useCallback(() => {
    hasStoredRef.current = false;
    isCreatingRef.current = false;
    useWalletStore.getState().reset();
  }, []);

  return { reset };
}
