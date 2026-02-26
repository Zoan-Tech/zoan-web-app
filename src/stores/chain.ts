import { create } from "zustand";
import type { Chain } from "@/types/wallet";
import { chainService } from "@/services/chain";

interface ChainState {
    chains: Chain[];
    isLoading: boolean;
    error: string | null;
    hasFetched: boolean;

    // Actions
    fetchChains: () => Promise<void>;
    getChainById: (id: number) => Chain | undefined;
}

export const useChainStore = create<ChainState>()((set, get) => ({
    chains: [],
    isLoading: false,
    error: null,
    hasFetched: false,

    fetchChains: async () => {
        // Skip if already fetched or currently loading
        if (get().hasFetched || get().isLoading) return;

        set({ isLoading: true, error: null });
        try {
            const chains = await chainService.getChains();
            set({ chains, isLoading: false, hasFetched: true });
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to fetch chains";
            console.error("[ChainStore] Failed to fetch chains:", message);
            set({ error: message, isLoading: false });
        }
    },

    getChainById: (id: number) => {
        return get().chains.find((c) => c.id === id);
    },
}));
