"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getNativeBalance,
  getTokenBalances,
  type TokenBalance,
} from "@/services/token-balance";
import {
  getNativeTokenPrice,
  getTokenPrices,
} from "@/services/token-price";

export interface TokenWithPrice extends TokenBalance {
  usd_price: number;
  usd_value: number;
}

interface UseTokenBalancesResult {
  nativeBalance: string;
  nativeUsdPrice: number;
  nativeUsdValue: number;
  tokens: TokenWithPrice[];
  isLoading: boolean;
  isRefetching: boolean;
  refetch: () => void;
}

export function useTokenBalances(
  address: string | undefined,
  chainId: number
): UseTokenBalancesResult {
  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["tokenBalances", address, chainId],
    queryFn: async () => {
      if (!address) throw new Error("No address");

      // Fetch balances and native price in parallel
      const [nativeBalance, tokens, nativeUsdPrice] = await Promise.all([
        getNativeBalance(chainId, address),
        getTokenBalances(chainId, address),
        getNativeTokenPrice(chainId),
      ]);

      // Fetch ERC20 prices
      const contractAddresses = tokens.map((t) => t.address);
      const tokenPrices = await getTokenPrices(chainId, contractAddresses);

      // Enrich tokens with USD prices
      const tokensWithPrices: TokenWithPrice[] = tokens.map((t) => {
        const price = tokenPrices[t.address.toLowerCase()] ?? 0;
        const balance = parseFloat(t.balance) || 0;
        return {
          ...t,
          usd_price: price,
          usd_value: price * balance,
        };
      });

      const nativeUsdValue =
        nativeUsdPrice * (parseFloat(nativeBalance) || 0);

      return {
        nativeBalance,
        nativeUsdPrice,
        nativeUsdValue,
        tokens: tokensWithPrices,
      };
    },
    enabled: !!address,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  return {
    nativeBalance: data?.nativeBalance ?? "0",
    nativeUsdPrice: data?.nativeUsdPrice ?? 0,
    nativeUsdValue: data?.nativeUsdValue ?? 0,
    tokens: data?.tokens ?? [],
    isLoading,
    isRefetching,
    refetch,
  };
}
