"use client";

import { PrivyProvider as PrivyProviderBase } from "@privy-io/react-auth";
import { defineChain } from "viem";
import { config } from "@/lib/config";
import { getAccessToken } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";

interface Props {
  children: React.ReactNode;
}

interface BackendRpcProvider {
  rpc_url: string;
  priority: number;
  is_active: boolean;
}

interface BackendChain {
  chain_id: number;
  name: string;
  explorer_url: string;
  native_currency_name: string;
  native_currency_symbol: string;
  native_currency_decimals: number;
  is_testnet: boolean;
  rpc_providers: BackendRpcProvider[];
}

const eniMainnet = defineChain({
  id: 173,
  name: "ENI Mainnet",
  nativeCurrency: {
    name: "EGAS",
    symbol: "EGAS",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.eniac.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "ENI Explorer",
      url: "https://exp.eniac.network",
    },
  },
});

const eniTestnet = defineChain({
  id: 174,
  name: "ENI Testnet",
  nativeCurrency: {
    name: "EGAS",
    symbol: "EGAS",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc-testnet.eniac.network"],
    },
  },
  blockExplorers: {
    default: {
      name: "ENI Testnet Explorer",
      url: "https://exp-testnet.eniac.network",
    },
  },
  testnet: true,
});

function mapBackendChainToViem(chain: BackendChain) {
  const activeProviders = (chain.rpc_providers ?? [])
    .filter((provider) => provider.is_active)
    .sort((left, right) => left.priority - right.priority);

  const rpcUrl = activeProviders[0]?.rpc_url;
  if (!rpcUrl) return null;

  return defineChain({
    id: chain.chain_id,
    name: chain.name,
    nativeCurrency: {
      name: chain.native_currency_name || chain.native_currency_symbol,
      symbol: chain.native_currency_symbol,
      decimals: chain.native_currency_decimals || 18,
    },
    rpcUrls: {
      default: {
        http: [rpcUrl],
      },
    },
    blockExplorers: chain.explorer_url
      ? {
          default: {
            name: `${chain.name} Explorer`,
            url: chain.explorer_url,
          },
        }
      : undefined,
    testnet: chain.is_testnet,
  });
}

export function PrivyProvider({ children }: Props) {
  const [apiChains, setApiChains] = useState<ReturnType<typeof defineChain>[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadChains = async () => {
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        const token = getAccessToken();
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch("/api/chains", { headers });
        if (!response.ok) return;

        const json = await response.json();
        const backendChains = (json?.data?.chains ?? []) as BackendChain[];
        const mappedChains = backendChains
          .map(mapBackendChainToViem)
          .filter((chain): chain is ReturnType<typeof defineChain> => chain !== null);

        if (!cancelled && mappedChains.length > 0) {
          setApiChains(mappedChains);
        }
      } catch {
        // Keep fallback chains
      }
    };

    loadChains();
    return () => {
      cancelled = true;
    };
  }, []);

  const supportedChains = useMemo(() => {
    if (apiChains.length > 0) return apiChains;
    return [eniMainnet, eniTestnet];
  }, [apiChains]);

  return (
    <PrivyProviderBase
      appId={config.privy.appId}
      config={{
        supportedChains,
        loginMethods: ["email"],
        appearance: {
          theme: "light",
          accentColor: "#27CEC5",
          logo: "/logo.png",
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      {children}
    </PrivyProviderBase>
  );
}
