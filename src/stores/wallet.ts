import { create } from "zustand";

interface WalletState {
  address: string | null;
  privyDid: string | null;
  isInitializing: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  setWallet: (address: string, privyDid: string) => void;
  setInitializing: (isInitializing: boolean) => void;
  setInitialized: (isInitialized: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useWalletStore = create<WalletState>()((set) => ({
  address: null,
  privyDid: null,
  isInitializing: false,
  isInitialized: false,
  error: null,

  setWallet: (address, privyDid) =>
    set({ address, privyDid, isInitialized: true, isInitializing: false, error: null }),

  setInitializing: (isInitializing) => set({ isInitializing }),

  setInitialized: (isInitialized) => set({ isInitialized }),

  setError: (error) => set({ error, isInitializing: false }),

  reset: () =>
    set({
      address: null,
      privyDid: null,
      isInitializing: false,
      isInitialized: false,
      error: null,
    }),
}));
