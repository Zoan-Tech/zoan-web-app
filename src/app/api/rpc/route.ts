import { NextRequest, NextResponse } from "next/server";
import type { Chain } from "@/types/wallet";

const RPC_TIMEOUT_MS = 10_000;
const CHAIN_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Simple in-memory cache for chains fetched from the backend
let cachedChains: Chain[] | null = null;
let cacheTimestamp = 0;

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8091/api/v1";

async function getChains(): Promise<Chain[]> {
  const now = Date.now();
  if (cachedChains && now - cacheTimestamp < CHAIN_CACHE_TTL_MS) {
    return cachedChains;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/chains`, {
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data?.chains) {
        cachedChains = json.data.chains.map((bc: Record<string, unknown>) => {
          const providers = (bc.rpc_providers as Array<Record<string, unknown>>) ?? [];
          const activeProviders = providers
            .filter((p) => p.is_active)
            .sort((a, b) => (a.priority as number) - (b.priority as number));
          return {
            id: bc.chain_id as number,
            name: bc.name as string,
            symbol: bc.native_currency_symbol as string,
            rpc_url: (activeProviders[0]?.rpc_url as string) ?? "",
            explorer_url: bc.explorer_url as string,
            logo_url: (bc.logo_url as string) || undefined,
            is_testnet: bc.is_testnet as boolean,
          } satisfies Chain;
        });
        cacheTimestamp = now;
        return cachedChains!;
      }
    }
  } catch (err) {
    console.warn("[RPC Proxy] Failed to fetch chains from backend, cache empty:", err);
  }

  // Return cached (even if stale) or empty
  return cachedChains ?? [];
}

// Only allow RPC methods the app actually uses.
const ALLOWED_METHODS = new Set([
  "eth_getBalance",
  "eth_estimateGas",
  "eth_gasPrice",
  "eth_call",
  "eth_sendTransaction",
  "eth_getTransactionReceipt",
]);

function fetchWithTimeout(url: string, body: string): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);

  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId));
}

/**
 * Server-side RPC proxy.
 * Uses only the backend Chain API for RPC URLs — no hardcoded Alchemy URLs.
 */
export async function POST(request: NextRequest) {
  try {
    const { chainId, method, params } = await request.json();

    if (!chainId || !method) {
      return NextResponse.json(
        { error: "chainId and method are required" },
        { status: 400 }
      );
    }

    if (!ALLOWED_METHODS.has(method)) {
      return NextResponse.json(
        { error: `Method "${method}" is not allowed` },
        { status: 403 }
      );
    }

    // RPC URL comes entirely from the backend chain data
    const chains = await getChains();
    const rpcUrl = chains.find((c) => c.id === chainId)?.rpc_url;

    if (!rpcUrl) {
      return NextResponse.json(
        { error: `No RPC URL for chain ${chainId}` },
        { status: 400 }
      );
    }

    const body = JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params: params ?? [],
    });

    const response = await fetchWithTimeout(rpcUrl, body);

    if (!response.ok) {
      return NextResponse.json(
        { error: `RPC error: ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return NextResponse.json(
        { error: "RPC request timed out" },
        { status: 504 }
      );
    }
    console.error("[RPC Proxy]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
