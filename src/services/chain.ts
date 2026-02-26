import { api } from "@/lib/api";
import type { Chain } from "@/types/wallet";

/** Shape returned by the backend for a single RPC provider */
export interface BackendRpcProvider {
    id: number;
    chain_id: number;
    provider_name: string;
    rpc_url: string;
    ws_url?: string;
    priority: number;
    is_active: boolean;
}

/** Shape returned by the backend for a single chain */
export interface BackendChain {
    id: number;
    chain_id: number;
    name: string;
    short_name: string;
    logo_url: string;
    explorer_url: string;
    explorer_api_url: string;
    native_currency_name: string;
    native_currency_symbol: string;
    native_currency_decimals: number;
    chain_type: string;
    usdc_contract_address: string;
    multicall3_address: string;
    avg_block_time_ms: number;
    is_testnet: boolean;
    is_active: boolean;
    sort_order: number;
    metadata: Record<string, unknown>;
    rpc_providers: BackendRpcProvider[];
}

/**
 * Convert a backend chain response into the app's Chain type.
 * Picks the highest-priority active RPC provider for `rpc_url`.
 */
function mapBackendChain(bc: BackendChain): Chain {
    // Sort providers by priority (lower = higher priority), pick first active
    const activeProviders = (bc.rpc_providers ?? [])
        .filter((p) => p.is_active)
        .sort((a, b) => a.priority - b.priority);

    return {
        id: bc.chain_id,
        name: bc.name,
        symbol: bc.native_currency_symbol,
        rpc_url: activeProviders[0]?.rpc_url ?? "",
        explorer_url: bc.explorer_url,
        explorer_api_url: bc.explorer_api_url || undefined,
        logo_url: bc.logo_url || undefined,
        is_testnet: bc.is_testnet,
    };
}

export const chainService = {
    /**
     * Fetch all chains from the backend.
     */
    async getChains(): Promise<Chain[]> {
        const response = await api.get("/chains");
        if (response.data.success) {
            const backendChains: BackendChain[] = response.data.data.chains;
            return backendChains.map(mapBackendChain);
        }
        throw new Error(response.data.message || "Failed to fetch chains");
    },

    /**
     * Fetch a single chain by its EVM chain ID.
     */
    async getChainById(chainId: number): Promise<Chain> {
        const response = await api.get(`/chains/${chainId}`);
        if (response.data.success) {
            return mapBackendChain(response.data.data);
        }
        throw new Error(response.data.message || "Chain not found");
    },
};
