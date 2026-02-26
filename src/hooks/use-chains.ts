"use client";

import { useEffect, useMemo } from "react";
import { useChainStore } from "@/stores/chain";

/**
 * Hook to access the chain list fetched from the backend.
 * Triggers a fetch on first mount if data hasn't been loaded yet.
 */
export function useChains() {
    const { chains, isLoading, error, hasFetched, fetchChains, getChainById } =
        useChainStore();

    useEffect(() => {
        if (!hasFetched && !isLoading) {
            fetchChains();
        }
    }, [hasFetched, isLoading, fetchChains]);

    const mainnets = useMemo(() => chains.filter((c) => !c.is_testnet), [chains]);
    const testnets = useMemo(() => chains.filter((c) => c.is_testnet), [chains]);

    return {
        chains,
        mainnets,
        testnets,
        isLoading,
        error,
        getChainById,
    };
}
