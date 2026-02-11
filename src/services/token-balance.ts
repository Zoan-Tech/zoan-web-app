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
 * Fetch ERC20 token balances using Alchemy's enhanced API (proxied).
 * Returns only tokens with non-zero balances, enriched with metadata.
 */
export async function getTokenBalances(
  chainId: number,
  address: string
): Promise<TokenBalance[]> {
  let result: AlchemyTokenBalanceResult;
  try {
    result = await rpcProxy<AlchemyTokenBalanceResult>(
      chainId,
      "alchemy_getTokenBalances",
      [address, "erc20"]
    );
  } catch {
    console.warn(`[TokenBalance] alchemy_getTokenBalances failed for chain ${chainId}, skipping ERC20s`);
    return [];
  }

  // Filter non-zero balances
  const nonZero = result.tokenBalances.filter(
    (t) => t.tokenBalance && t.tokenBalance !== "0x0" && t.tokenBalance !== "0x"
  );

  if (nonZero.length === 0) return [];

  // Fetch metadata for each token in parallel
  const tokens = await Promise.all(
    nonZero.map(async (t) => {
      try {
        const metadata = await rpcProxy<AlchemyTokenMetadata>(
          chainId,
          "alchemy_getTokenMetadata",
          [t.contractAddress]
        );

        return {
          address: t.contractAddress,
          symbol: metadata.symbol || "???",
          name: metadata.name || "Unknown Token",
          decimals: metadata.decimals || 18,
          balance: formatBalance(t.tokenBalance, metadata.decimals || 18),
          logo_url: metadata.logo || undefined,
        };
      } catch {
        return null;
      }
    })
  );

  return tokens.filter(
    (t): t is NonNullable<typeof t> => t !== null && t.balance !== "0"
  ) as TokenBalance[];
}
