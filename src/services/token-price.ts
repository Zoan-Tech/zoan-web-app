/**
 * Token price service using CoinGecko's free API.
 * Testnets return $0 since testnet tokens have no real value.
 */

// Map chain IDs to CoinGecko platform IDs (for ERC20 token lookups)
const COINGECKO_PLATFORM_IDS: Record<number, string> = {
  1: "ethereum",
  137: "polygon-pos",
  8453: "base",
  10: "optimistic-ethereum",
  42161: "arbitrum-one",
  56: "binance-smart-chain",
};

// Map chain IDs to CoinGecko native token coin IDs
const NATIVE_TOKEN_COIN_IDS: Record<number, string> = {
  1: "ethereum",
  137: "matic-network",
  8453: "ethereum",
  10: "ethereum",
  42161: "ethereum",
  56: "binancecoin",
};

// Testnet chain IDs — no real prices
const TESTNET_CHAIN_IDS = new Set([11155111, 84532, 421614]);

interface PriceCache {
  prices: Record<string, number>;
  timestamp: number;
}

// Simple in-memory cache (60s TTL)
const priceCache = new Map<string, PriceCache>();
const CACHE_TTL = 60_000;

function getCachedPrices(cacheKey: string): Record<string, number> | null {
  const cached = priceCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.prices;
  }
  return null;
}

function setCachedPrices(cacheKey: string, prices: Record<string, number>) {
  priceCache.set(cacheKey, { prices, timestamp: Date.now() });
}

/**
 * Fetch USD price for the native token of a chain.
 * Returns 0 for testnets.
 */
export async function getNativeTokenPrice(chainId: number): Promise<number> {
  if (TESTNET_CHAIN_IDS.has(chainId)) return 0;

  const coinId = NATIVE_TOKEN_COIN_IDS[chainId];
  if (!coinId) return 0;

  const cacheKey = `native:${coinId}`;
  const cached = getCachedPrices(cacheKey);
  if (cached) return cached[coinId] ?? 0;

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
    );
    if (!response.ok) return 0;

    const data = await response.json();
    const price = data[coinId]?.usd ?? 0;
    setCachedPrices(cacheKey, { [coinId]: price });
    return price;
  } catch {
    return 0;
  }
}

/**
 * Fetch USD prices for ERC20 tokens by contract address.
 * Returns a map of lowercase contract address → USD price.
 * Returns empty map for testnets.
 */
export async function getTokenPrices(
  chainId: number,
  contractAddresses: string[]
): Promise<Record<string, number>> {
  if (TESTNET_CHAIN_IDS.has(chainId) || contractAddresses.length === 0) {
    return {};
  }

  const platformId = COINGECKO_PLATFORM_IDS[chainId];
  if (!platformId) return {};

  const addresses = contractAddresses.map((a) => a.toLowerCase());
  const cacheKey = `tokens:${chainId}:${addresses.sort().join(",")}`;
  const cached = getCachedPrices(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/token_price/${platformId}?contract_addresses=${addresses.join(",")}&vs_currencies=usd`
    );
    if (!response.ok) return {};

    const data = await response.json();
    const prices: Record<string, number> = {};
    for (const addr of addresses) {
      prices[addr] = data[addr]?.usd ?? 0;
    }
    setCachedPrices(cacheKey, prices);
    return prices;
  } catch {
    return {};
  }
}

/**
 * Format a USD value for display.
 */
export function formatUsd(value: number): string {
  if (value === 0) return "$0.00";
  if (value < 0.01) return "<$0.01";
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
