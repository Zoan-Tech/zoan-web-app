export interface Transfer {
  hash: string;
  from: string;
  to: string | null;
  value: number | null;
  asset: string | null;
  category: string;
  blockNum: string;
  timestamp: string | null;
  direction: "sent" | "received";
}

interface AlchemyTransfer {
  hash: string;
  from: string;
  to: string | null;
  value: number | null;
  asset: string | null;
  category: string;
  blockNum: string;
  metadata?: { blockTimestamp?: string };
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

interface AlchemyTokenBalanceResult {
  address: string;
  tokenBalances: Array<{
    contractAddress: string;
    tokenBalance: string;
  }>;
}

interface AlchemyTokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  logo: string | null;
}

const RPC_TIMEOUT_MS = 10_000;

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
      headers: { "Content-Type": "application/json" },
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
 * Fetch ERC20 token balances.
 * NOTE: Without Alchemy's enhanced API, ERC20 token discovery requires a
 * known token list (e.g. from the backend). For now, returns empty.
 * Standard RPC nodes don't support enumerating all ERC20 tokens for an address.
 */
export async function getTokenBalances(
  _chainId: number,
  _address: string
): Promise<TokenBalance[]> {
  // TODO: Implement ERC20 token discovery using a backend token list
  // instead of Alchemy's alchemy_getTokenBalances method.
  return [];
}

/**
 * Fetch transaction history.
 * NOTE: Without Alchemy's alchemy_getAssetTransfers, transaction history
 * should be fetched from the backend or block explorer API.
 */
export async function getTransactionHistory(
  _chainId: number,
  _address: string
): Promise<Transfer[]> {
  // TODO: Implement transaction history using the backend or explorer API
  // instead of Alchemy's alchemy_getAssetTransfers method.
  return [];
}

