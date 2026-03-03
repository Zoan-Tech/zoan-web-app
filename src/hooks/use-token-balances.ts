"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getNativeBalance,
  getChainTokenList,
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
  chainId: number,
  options?: {
    /** When true, include tokens with 0 balance (useful for Swap pickers). */
    includeZeroBalances?: boolean;
    /** When true, also fetch a chain-wide ERC20 token list (useful for Swap pickers). */
    includeChainTokenList?: boolean;
  }
): UseTokenBalancesResult {
  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: [
      "tokenBalances",
      address,
      chainId,
      options?.includeZeroBalances === true,
      options?.includeChainTokenList === true,
    ],
    queryFn: async () => {
      if (!address) throw new Error("No address");

      // Fetch balances and native price in parallel
      const [nativeBalance, walletTokens, nativeUsdPrice, chainTokens] = await Promise.all([
        getNativeBalance(chainId, address),
        getTokenBalances(chainId, address, { includeZeroBalances: options?.includeZeroBalances }),
        getNativeTokenPrice(chainId),
        options?.includeChainTokenList
          ? getChainTokenList(chainId)
          : Promise.resolve([] as TokenBalance[]),
      ]);

      // Merge: start with chain tokens (balance=0), then overwrite with wallet tokens (real balance)
      const tokenByAddress = new Map<string, TokenBalance>();
      for (const t of chainTokens) tokenByAddress.set(t.address.toLowerCase(), t);
      for (const t of walletTokens) tokenByAddress.set(t.address.toLowerCase(), t);
      const tokens = Array.from(tokenByAddress.values());

      // Fetch ERC20 prices
      const contractAddresses = Array.from(
        new Set(tokens.map((t) => t.address.toLowerCase()))
      );
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
