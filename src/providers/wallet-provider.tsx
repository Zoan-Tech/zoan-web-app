"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePrivy, useSyncJwtBasedAuthState, type UseSyncJwtBasedAuthStateInput } from "@privy-io/react-auth";
import { useAuthStore } from "@/stores/auth";
import { useWalletStore } from "@/stores/wallet";
import { useWalletInit } from "@/hooks/use-wallet-init";
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
  const prevStatusRef = useRef(status);

  // Ref so stable callbacks can always read the latest isAuthenticated value
  const isAuthenticatedRef = useRef(isAuthenticated);
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  // Privy stores its onJwtAuthStateChange callback here so we can call it manually
  const notifyPrivyRef = useRef<(() => void) | null>(null);

  // Stable JWT getter — reads isAuthenticated via ref so the function reference never
  // changes. This prevents a stale-closure bug where useSyncJwtBasedAuthState holds the
  // initial reference (isAuthenticated=false) and silently returns undefined even after
  // isAuthenticated becomes true, causing Privy to never authenticate.
  const getExternalJwt = useCallback(async () => {
    if (!isAuthenticatedRef.current) {
      cachedJwtRef.current = undefined;
      return undefined;
    }
    if (cachedJwtRef.current) {
      return cachedJwtRef.current;
    }
    try {
      const token = await walletService.getWalletAuth();
      cachedJwtRef.current = token;
      return token;
    } catch (error) {
      console.error("[WalletProvider] Failed to get Privy JWT:", error);
      return undefined;
    }
  }, []); // stable — reads isAuthenticated via isAuthenticatedRef, never recreated

  // Stable subscribe — Privy calls this ONCE on mount to hand us the `onJwtAuthStateChange`
  // callback. We store it and call it ourselves whenever isAuthenticated changes.
  //
  // This replaces `useSubscribeToJwtAuthWithFlag`, which only reacts to Privy's OWN
  // session events (e.g. token expiry on rehydration). On a fresh first login with no
  // stored Privy state those events never fire, so getExternalJwt was never called and
  // privyUser stayed null indefinitely.
  const subscribe = useCallback<UseSyncJwtBasedAuthStateInput["subscribe"]>(
    (onJwtAuthStateChange) => {
      notifyPrivyRef.current = onJwtAuthStateChange;
      // Notify immediately if already authenticated at mount time
      if (isAuthenticatedRef.current) {
        onJwtAuthStateChange();
      }
      return () => {
        notifyPrivyRef.current = null;
      };
    },
    [], // stable — reads isAuthenticated via ref, never recreated
  );

  // Notify Privy on every isAuthenticated change (handles the first-login transition)
  useEffect(() => {
    if (notifyPrivyRef.current) {
      notifyPrivyRef.current();
    }
  }, [isAuthenticated]);

  const onAuthenticated = useCallback(() => {}, []);

  const onUnauthenticated = useCallback(() => {
    cachedJwtRef.current = undefined;
    resetWallet();
  }, [resetWallet]);

  const onError = useCallback((error: Error) => {
    console.error("[WalletProvider] Privy auth sync error:", error);
    useWalletStore.getState().setError("Failed to sync with Privy");
  }, []);

  useSyncJwtBasedAuthState({
    subscribe,
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
      resetWallet();
      privyLogout().catch(() => {
        // Ignore logout errors — session may already be cleared
      });
    }
  }, [status, resetWallet, privyLogout]);

  return <>{children}</>;
}
