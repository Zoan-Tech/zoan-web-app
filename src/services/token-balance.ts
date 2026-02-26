import { getAccessToken } from "@/lib/api";

export interface Transfer {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: string;
  blockNumber: string;
  isError: boolean;
  direction: "sent" | "received";
}

export interface TokenBalance {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  logo_url?: string;
}

interface JsonRpcResponse<T> {
  jsonrpc: string;
  id: number;
  result: T;
}

const RPC_TIMEOUT_MS = 10_000;

/**
 * Build headers with auth token for internal API calls.
 */
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Make a JSON-RPC call through our Next.js API proxy to avoid CORS issues.
 */
async function rpcProxy<T>(
  chainId: number,
  method: string,
  params: unknown[]
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), RPC_TIMEOUT_MS);

  try {
    const response = await fetch("/api/rpc", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ chainId, method, params }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`RPC proxy error: ${response.status}`);
    }

    const data: JsonRpcResponse<T> = await response.json();
    return data.result;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(`RPC call timed out after ${RPC_TIMEOUT_MS}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Convert a hex balance string (in wei) to a human-readable decimal string.
 */
export function formatBalance(hexBalance: string, decimals: number): string {
  if (!hexBalance || hexBalance === "0x0" || hexBalance === "0x") return "0";

  const raw = BigInt(hexBalance);
  const zero = BigInt(0);
  if (raw === zero) return "0";

  const divisor = BigInt(10) ** BigInt(decimals);
  const whole = raw / divisor;
  const remainder = raw % divisor;

  if (remainder === zero) return whole.toString();

  // Pad remainder with leading zeros up to `decimals` length, then trim trailing zeros
  const fracStr = remainder.toString().padStart(decimals, "0").replace(/0+$/, "");
  // Show at most 6 decimal places
  const trimmed = fracStr.slice(0, 6);

  return `${whole}.${trimmed}`;
}

/**
 * Fetch native token balance (ETH, MATIC, BNB, etc.) for a given address on a chain.
 */
export async function getNativeBalance(
  chainId: number,
  address: string
): Promise<string> {
  const hexBalance = await rpcProxy<string>(chainId, "eth_getBalance", [
    address,
    "latest",
  ]);
  return formatBalance(hexBalance, 18);
}

/**
 * Fetch ERC20 token balances using the block explorer API (via /api/token-scan).
 * Discovers tokens from transfer history, then checks on-chain balanceOf.
 */
export async function getTokenBalances(
  chainId: number,
  address: string
): Promise<TokenBalance[]> {
  try {
    const response = await fetch("/api/token-scan", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ chainId, address }),
    });

    if (!response.ok) {
      console.warn(`[TokenBalance] Token scan failed for chain ${chainId}: ${response.status}`);
      return [];
    }

    const json = await response.json();
    if (json.success && Array.isArray(json.data)) {
      return json.data;
    }
    return [];
  } catch (err) {
    console.warn("[TokenBalance] Token scan error:", err);
    return [];
  }
}

/**
 * Fetch transaction history using the block explorer API (via /api/token-scan).
 */
export async function getTransactionHistory(
  chainId: number,
  address: string
): Promise<Transfer[]> {
  try {
    const response = await fetch("/api/token-scan", {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ chainId, address, action: "txlist" }),
    });

    if (!response.ok) {
      console.warn(`[TokenBalance] Transaction history failed for chain ${chainId}: ${response.status}`);
      return [];
    }

    const json = await response.json();
    if (json.success && Array.isArray(json.data)) {
      return json.data;
    }
    return [];
  } catch (err) {
    console.warn("[TokenBalance] Transaction history error:", err);
    return [];
  }
}
