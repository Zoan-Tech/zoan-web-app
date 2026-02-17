"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePrivy, useWallets, useCreateWallet } from "@privy-io/react-auth";
import { useAuthStore } from "@/stores/auth";
import { useWalletStore } from "@/stores/wallet";
import { walletService } from "@/services/wallet";

/**
 * Wallet initialization hook
 *
 * Flow:
 * 1. Wait for Privy ready + backend authenticated
 * 2. Give Privy's JWT sync a moment to populate wallets before deciding to create
 * 3. Get or create embedded wallet
 * 4. Store wallet to backend (idempotent)
 * 5. Update state
 *
 * First-login vs refresh behaviour:
 * - Refresh: Privy rehydrates from localStorage → wallets pre-populated when effect fires.
 * - First login: backend auth fires the effect while Privy's JWT sync is still in-flight,
 *   so wallets is initially empty. We poll walletsRef (a live ref) for up to 2s before
 *   falling through to createWallet(), and keep wallets/privyUser in deps so we retry
 *   automatically once Privy finishes authenticating.
 */
export function useWalletInit() {
  const { user: privyUser, ready } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const { createWallet } = useCreateWallet();
  const { status: backendAuthStatus } = useAuthStore();
  const {
    isInitialized,
    setWallet,
    setInitializing,
    setError,
  } = useWalletStore();

  const isInitializingRef = useRef(false);

  // Live refs so async code never reads stale closure values
  const walletsRef = useRef(wallets);
  useEffect(() => {
    walletsRef.current = wallets;
  }, [wallets]);

  const privyUserRef = useRef(privyUser);
  useEffect(() => {
    privyUserRef.current = privyUser;
  }, [privyUser]);

  useEffect(() => {
    const initializeWallet = async () => {
      const isBackendAuthenticated =
        backendAuthStatus === "authenticated" || backendAuthStatus === "onboarding_required";

      if (!ready || !walletsReady || !isBackendAuthenticated || isInitialized || isInitializingRef.current) {
        return;
      }

      isInitializingRef.current = true;
      setInitializing(true);

      try {
        // Step 1: Find existing embedded wallet.
        // On first login Privy's JWT sync may still be in-flight, so poll the live
        // walletsRef for up to 2s before deciding to create a new one.
        let embeddedWallet = walletsRef.current.find((w) => w.walletClientType === "privy");

        if (!embeddedWallet) {
          for (let i = 0; i < 8; i++) {
            await new Promise(resolve => setTimeout(resolve, 250));
            embeddedWallet = walletsRef.current.find((w) => w.walletClientType === "privy");
            if (embeddedWallet) break;
          }
        }

        // Step 2: If still no wallet and Privy hasn't authenticated yet, defer.
        // createWallet() requires a Privy session — exit so the wallets/privyUser
        // deps trigger a retry once Privy finishes authenticating.
        if (!embeddedWallet && !privyUserRef.current) {
          return;
        }

        // Step 3: Create embedded wallet for new users
        if (!embeddedWallet) {
          try {
            await createWallet();
            for (let i = 0; i < 10; i++) {
              await new Promise(resolve => setTimeout(resolve, 300));
              embeddedWallet = walletsRef.current.find((w) => w.walletClientType === "privy");
              if (embeddedWallet) break;
            }
          } catch (err) {
            const error = err as Error;
            // Wallet already exists — poll for it to appear in walletsRef
            if (error.message?.includes("already has")) {
              for (let i = 0; i < 10; i++) {
                await new Promise(resolve => setTimeout(resolve, 300));
                embeddedWallet = walletsRef.current.find((w) => w.walletClientType === "privy");
                if (embeddedWallet) break;
              }
            } else {
              throw err;
            }
          }
        }

        if (!embeddedWallet) {
          throw new Error("Failed to get or create embedded wallet");
        }

        // Step 4: Get Privy DID — read via ref to avoid stale closure
        const privyDid =
          privyUserRef.current?.id ||
          (embeddedWallet as { importedUserId?: string }).importedUserId;

        if (!privyDid) {
          throw new Error("No Privy DID available");
        }

        // Step 5: Store wallet to backend (idempotent)
        await walletService.storeWallet(embeddedWallet.address, privyDid);

        // Step 6: Update state
        setWallet(embeddedWallet.address, privyDid);
      } catch (error) {
        console.error("[WalletInit] Initialization failed:", error);
        const errorMsg = error instanceof Error ? error.message : "Failed to initialize wallet";
        setError(errorMsg);
      } finally {
        isInitializingRef.current = false;
        setInitializing(false);
      }
    };

    initializeWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    ready,
    walletsReady,
    backendAuthStatus,
    isInitialized,
    wallets,    // retry when Privy populates the wallet list after JWT sync
    privyUser,  // retry when Privy finishes authenticating (needed to gate createWallet)
  ]);

  const reset = useCallback(() => {
    isInitializingRef.current = false;
    useWalletStore.getState().reset();
  }, []);

  return { reset };
}
