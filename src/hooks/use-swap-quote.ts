"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getSwapQuote, toSellAmountRaw, isSwapSupported, type SwapQuote } from "@/services/swap";

interface UseSwapQuoteParams {
  chainId: number;
  sellToken: string;      // "native" or ERC20 address
  buyToken: string;       // "native" or ERC20 address
  fromAmount: string;     // human-readable
  sellDecimals: number;
  buyDecimals: number;
  taker: string;
  slippageBps: number;
  enabled: boolean;
}

interface UseSwapQuoteResult {
  quote: SwapQuote | null;
  isLoading: boolean;
  error: string | null;
}

/** Debounce a value by `delay` ms */
function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function useSwapQuote({
  chainId,
  sellToken,
  buyToken,
  fromAmount,
  sellDecimals,
  buyDecimals,
  taker,
  slippageBps,
  enabled,
}: UseSwapQuoteParams): UseSwapQuoteResult {
  const debouncedAmount = useDebounced(fromAmount, 500);

  const sellAmountRaw = debouncedAmount
    ? toSellAmountRaw(debouncedAmount, sellDecimals)
    : "0";

  const canFetch =
    enabled &&
    isSwapSupported(chainId) &&
    !!sellToken &&
    !!buyToken &&
    sellToken !== buyToken &&
    !!debouncedAmount &&
    parseFloat(debouncedAmount) > 0 &&
    sellAmountRaw !== "0" &&
    !!taker;

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "swapQuote",
      chainId,
      sellToken,
      buyToken,
      sellAmountRaw,
      taker,
      slippageBps,
    ],
    queryFn: () =>
      getSwapQuote({
        chainId,
        sellToken,
        buyToken,
        sellAmountRaw,
        taker,
        slippageBps,
        sellTokenDecimals: sellDecimals,
        buyTokenDecimals: buyDecimals,
      }),
    enabled: canFetch,
    staleTime: 15_000,
    refetchInterval: 30_000, // auto-refresh quotes every 30s
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return {
    quote: data ?? null,
    isLoading: canFetch && isLoading,
    error: error instanceof Error ? error.message : null,
  };
}
