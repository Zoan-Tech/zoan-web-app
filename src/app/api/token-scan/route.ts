import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8091/api/v1";
const CHAIN_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const EXPLORER_TIMEOUT_MS = 15_000;

// ---------------------------------------------------------------------------
// Chain cache (reuses the same pattern as the RPC proxy)
// ---------------------------------------------------------------------------
interface CachedChainInfo {
    chain_id: number;
    explorer_url: string;        // e.g. https://scan-testnet.eniac.network
    explorer_api_url: string;    // Etherscan-compatible API (if available)
    rpc_url: string;
}

let cachedChains: CachedChainInfo[] | null = null;
let cacheTimestamp = 0;

async function getChainInfo(chainId: number, authHeader?: string | null): Promise<CachedChainInfo | null> {
    const now = Date.now();
    if (!cachedChains || now - cacheTimestamp > CHAIN_CACHE_TTL_MS) {
        try {
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (authHeader) {
                headers["Authorization"] = authHeader;
            }

            const res = await fetch(`${BACKEND_URL}/chains`, { headers });
            if (res.ok) {
                const json = await res.json();
                if (json.success && json.data?.chains) {
                    cachedChains = json.data.chains.map(
                        (bc: Record<string, unknown>) => {
                            const providers =
                                (bc.rpc_providers as Array<Record<string, unknown>>) ?? [];
                            const active = providers
                                .filter((p) => p.is_active)
                                .sort(
                                    (a, b) => (a.priority as number) - (b.priority as number)
                                );
                            return {
                                chain_id: bc.chain_id as number,
                                explorer_url: (bc.explorer_url as string) || "",
                                explorer_api_url: (bc.explorer_api_url as string) || "",
                                rpc_url: (active[0]?.rpc_url as string) ?? "",
                            };
                        }
                    );
                    cacheTimestamp = now;
                }
            }
        } catch (err) {
            console.warn("[TokenScan] Failed to fetch chains:", err);
        }
    }
    return cachedChains?.find((c) => c.chain_id === chainId) ?? null;
}

// ---------------------------------------------------------------------------
// Blockscout V2 API types
// ---------------------------------------------------------------------------
interface BlockscoutTokenItem {
    token: {
        address: string;
        name: string;
        symbol: string;
        decimals: string;
        icon_url: string | null;
        type: string;
    };
    value: string; // raw balance in smallest unit
}

interface BlockscoutTxItem {
    hash: string;
    from: { hash: string };
    to: { hash: string } | null;
    value: string;
    timestamp: string;   // ISO 8601
    block: number;
    status: string;      // "ok" | "error"
    method: string | null;
    fee: { value: string };
}

// ---------------------------------------------------------------------------
// Blockscout V2 fetcher
// ---------------------------------------------------------------------------
async function fetchBlockscoutV2<T>(url: string): Promise<T | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), EXPLORER_TIMEOUT_MS);

    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) return null;
        return (await res.json()) as T;
    } catch {
        return null;
    } finally {
        clearTimeout(timeoutId);
    }
}

// ---------------------------------------------------------------------------
// Format balance from raw integer string to decimal string
// ---------------------------------------------------------------------------
function formatBalance(rawBalance: string, decimals: number): string {
    if (!rawBalance || rawBalance === "0") return "0";

    try {
        const raw = BigInt(rawBalance);
        if (raw === BigInt(0)) return "0";

        const divisor = BigInt(10) ** BigInt(decimals);
        const whole = raw / divisor;
        const remainder = raw % divisor;

        if (remainder === BigInt(0)) return whole.toString();

        const fracStr = remainder
            .toString()
            .padStart(decimals, "0")
            .replace(/0+$/, "");
        const trimmed = fracStr.slice(0, 6);
        return `${whole}.${trimmed}`;
    } catch {
        return "0";
    }
}

// ---------------------------------------------------------------------------
// Token scan via Blockscout V2
// ---------------------------------------------------------------------------
async function scanTokensBlockscoutV2(explorerUrl: string, address: string) {
    const apiUrl = `${explorerUrl}/api/v2/addresses/${address}/tokens?type=ERC-20`;
    const data = await fetchBlockscoutV2<{ items: BlockscoutTokenItem[] }>(apiUrl);

    if (!data?.items) return [];

    return data.items
        .map((item) => {
            const decimals = parseInt(item.token.decimals, 10) || 18;
            const balance = formatBalance(item.value, decimals);
            return {
                address: item.token.address,
                symbol: item.token.symbol || "???",
                name: item.token.name || "Unknown Token",
                decimals,
                balance,
                logo_url: item.token.icon_url || undefined,
            };
        })
        .filter((t) => t.balance !== "0" && parseFloat(t.balance) > 0);
}

// ---------------------------------------------------------------------------
// Transaction history via Blockscout V2
// ---------------------------------------------------------------------------
async function fetchTxHistoryBlockscoutV2(explorerUrl: string, address: string) {
    const apiUrl = `${explorerUrl}/api/v2/addresses/${address}/transactions?filter=to%20%7C%20from`;
    const data = await fetchBlockscoutV2<{ items: BlockscoutTxItem[] }>(apiUrl);

    if (!data?.items) return [];

    return data.items.map((tx) => ({
        hash: tx.hash,
        from: tx.from.hash,
        to: tx.to?.hash || "",
        value: tx.value,
        timestamp: tx.timestamp,
        blockNumber: tx.block.toString(),
        isError: tx.status === "error",
        direction:
            tx.from.hash.toLowerCase() === address.toLowerCase()
                ? ("sent" as const)
                : ("received" as const),
    }));
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------
/**
 * Token scan endpoint.
 * Uses the chain's explorer_url with Blockscout V2 API to discover
 * all ERC20 tokens held by a wallet (with balances already included).
 *
 * Body: { chainId: number, address: string }
 * Also supports: { chainId, address, action: "txlist" } for transaction history.
 */
export async function POST(request: NextRequest) {
    try {
        const { chainId, address, action } = await request.json();

        if (!chainId || !address) {
            return NextResponse.json(
                { error: "chainId and address are required" },
                { status: 400 }
            );
        }

        const authHeader = request.headers.get("authorization");
        const chain = await getChainInfo(chainId, authHeader);

        // If no chain found or no explorer URL, return empty data gracefully
        if (!chain || !chain.explorer_url) {
            return NextResponse.json({ success: true, data: [] });
        }

        // Clean up explorer URL (remove trailing slash)
        const explorerUrl = chain.explorer_url.replace(/\/+$/, "");

        // --- Transaction history ---
        if (action === "txlist") {
            const transfers = await fetchTxHistoryBlockscoutV2(explorerUrl, address);
            return NextResponse.json({ success: true, data: transfers });
        }

        // --- Token scan (default) ---
        const tokens = await scanTokensBlockscoutV2(explorerUrl, address);
        return NextResponse.json({ success: true, data: tokens });
    } catch (err) {
        console.error("[TokenScan]", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
