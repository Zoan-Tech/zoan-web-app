"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getBridgeQuote, type BridgeQuote } from "@/services/bridge";

interface UseBridgeQuoteParams {
  sourceChainId: number;
  destChainId: number;
  sourceToken: string;
  destToken: string;
  amount: string;
  decimals?: number;
  userAddress: string;
  enabled: boolean;
}

interface UseBridgeQuoteResult {
  quote: BridgeQuote | null;
  isLoading: boolean;
  error: string | null;
}

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function useBridgeQuote({
  sourceChainId,
  destChainId,
  sourceToken,
  destToken,
  amount,
  decimals = 18,
  userAddress,
  enabled,
}: UseBridgeQuoteParams): UseBridgeQuoteResult {
  const debouncedAmount = useDebounced(amount, 600);

  const canFetch =
    enabled &&
    sourceChainId !== destChainId &&
    !!sourceToken &&
    !!destToken &&
    !!debouncedAmount &&
    parseFloat(debouncedAmount) > 0 &&
    !!userAddress;

  const { data, isLoading, error } = useQuery<BridgeQuote, Error>({
    queryKey: [
      "bridgeQuote",
      sourceChainId,
      destChainId,
      sourceToken,
      destToken,
      debouncedAmount,
      userAddress,
    ],
    queryFn: () =>
      getBridgeQuote({
        sourceChainId,
        destChainId,
        sourceToken,
        destToken,
        amount: debouncedAmount,
        decimals,
        userAddress,
        targetRecipient: userAddress,
      }),
    enabled: canFetch,
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return {
    quote: data ?? null,
    isLoading: canFetch && isLoading,
    error: error instanceof Error ? error.message : null,
  };
}
