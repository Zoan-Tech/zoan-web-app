"use client";

import { useQuery } from "@tanstack/react-query";
import { getTransactionHistory, type Transfer } from "@/services/token-balance";

export function useTransactionHistory(
  address: string | undefined,
  chainId: number
) {
  return useQuery<Transfer[]>({
    queryKey: ["transactionHistory", address, chainId],
    queryFn: () => getTransactionHistory(chainId, address!),
    enabled: !!address,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}
