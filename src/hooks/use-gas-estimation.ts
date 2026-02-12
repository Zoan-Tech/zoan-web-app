"use client";

import { useState, useCallback } from "react";
import { formatBalance } from "@/services/token-balance";

export interface GasEstimation {
  gasLimit: string;
  gasPrice: string;
  gasCostWei: bigint;
  gasCostFormatted: string;
  gasCostUsd: number;
}

interface UseGasEstimationResult {
  estimation: GasEstimation | null;
  isEstimating: boolean;
  error: string | null;
  estimate: (params: {
    chainId: number;
    from: string;
    to: string;
    value?: string;
    data?: string;
    nativeUsdPrice: number;
  }) => Promise<GasEstimation | null>;
}

async function rpcCall<T>(chainId: number, method: string, params: unknown[]): Promise<T> {
  const response = await fetch("/api/rpc", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chainId, method, params }),
  });

  if (!response.ok) {
    throw new Error(`RPC error: ${response.status}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message || "RPC call failed");
  }
  return data.result;
}

export function useGasEstimation(): UseGasEstimationResult {
  const [estimation, setEstimation] = useState<GasEstimation | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const estimate = useCallback(
    async ({
      chainId,
      from,
      to,
      value,
      data,
      nativeUsdPrice,
    }: {
      chainId: number;
      from: string;
      to: string;
      value?: string;
      data?: string;
      nativeUsdPrice: number;
    }): Promise<GasEstimation | null> => {
      setIsEstimating(true);
      setError(null);

      try {
        const txObj: Record<string, string> = { from, to };
        if (value) txObj.value = value;
        if (data) txObj.data = data;

        const [gasLimitHex, gasPriceHex] = await Promise.all([
          rpcCall<string>(chainId, "eth_estimateGas", [txObj]),
          rpcCall<string>(chainId, "eth_gasPrice", []),
        ]);

        const gasLimit = BigInt(gasLimitHex);
        const gasPrice = BigInt(gasPriceHex);
        const gasCostWei = gasLimit * gasPrice;

        const gasCostFormatted = formatBalance(
          "0x" + gasCostWei.toString(16),
          18
        );
        const gasCostUsd =
          nativeUsdPrice * (Number(gasCostWei) / 1e18);

        const result: GasEstimation = {
          gasLimit: gasLimitHex,
          gasPrice: gasPriceHex,
          gasCostWei,
          gasCostFormatted,
          gasCostUsd,
        };

        setEstimation(result);
        return result;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to estimate gas";
        setError(message);
        setEstimation(null);
        return null;
      } finally {
        setIsEstimating(false);
      }
    },
    []
  );

  return { estimation, isEstimating, error, estimate };
}
