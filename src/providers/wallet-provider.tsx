"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePrivy, useSubscribeToJwtAuthWithFlag } from "@privy-io/react-auth";
import { useAuthStore } from "@/stores/auth";
import { useWalletStore } from "@/stores/wallet";
import { useWalletInit } from "@/hooks/useWalletInit";
import { walletService } from "@/services/wallet";

interface Props {
  children: React.ReactNode;
}

export function WalletProvider({ children }: Props) {
  const { status } = useAuthStore();
  const { logout: privyLogout } = usePrivy();
  const { reset: resetWallet } = useWalletInit();

  const isAuthenticated = status === "authenticated";
  const cachedJwtRef = useRef<string | undefined>(undefined);
  const hasLoggedAuthRef = useRef(false);
  const prevStatusRef = useRef(status);

  // Cache the JWT so we don't re-fetch on every sync cycle
  const getExternalJwt = useCallback(async () => {
    if (!isAuthenticated) {
      cachedJwtRef.current = undefined;
      return undefined;
    }
    if (cachedJwtRef.current) return cachedJwtRef.current;
    try {
      const token = await walletService.getWalletAuth();
      cachedJwtRef.current = token;
      return token;
    } catch (error) {
      console.error("[WalletProvider] Failed to get Privy JWT:", error);
      return undefined;
    }
  }, [isAuthenticated]);

  const onAuthenticated = useCallback(({ user }: { user: { id: string }; isNewUser: boolean }) => {
    if (!hasLoggedAuthRef.current) {
      console.log("[WalletProvider] Privy authenticated:", user.id);
      hasLoggedAuthRef.current = true;
    }
  }, []);

  const onUnauthenticated = useCallback(() => {
    console.log("[WalletProvider] Privy unauthenticated");
    hasLoggedAuthRef.current = false;
    cachedJwtRef.current = undefined;
    resetWallet();
  }, [resetWallet]);

  const onError = useCallback((error: Error) => {
    console.error("[WalletProvider] Privy auth sync error:", error);
    useWalletStore.getState().setError("Failed to sync with Privy");
  }, []);

  // Sync our custom auth state with Privy
  useSubscribeToJwtAuthWithFlag({
    isAuthenticated,
    getExternalJwt,
    onAuthenticated,
    onUnauthenticated,
    onError,
  });

  // Handle logout: clear Privy session only on authenticated → unauthenticated transition
  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = status;

    if (prevStatus === "authenticated" && status === "unauthenticated") {
      cachedJwtRef.current = undefined;
      hasLoggedAuthRef.current = false;
      resetWallet();
      privyLogout().catch(() => {
        // Ignore logout errors — session may already be cleared
      });
    }
  }, [status, resetWallet, privyLogout]);

  return <>{children}</>;
}
