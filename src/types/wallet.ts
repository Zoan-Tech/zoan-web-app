export interface WalletInfo {
  address: string;
  chain_id: number;
  balance: string;
  tokens: Token[];
}

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  usd_value?: number;
  logo_url?: string;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gas_used: string;
  gas_price: string;
  block_number: number;
  timestamp: string;
  status: "pending" | "confirmed" | "failed";
  type: "send" | "receive" | "swap" | "contract";
}

export interface SendTransactionRequest {
  to: string;
  value: string;
  data?: string;
  chain_id: number;
}

export interface Chain {
  id: number;
  name: string;
  symbol: string;
  rpc_url: string;
  explorer_url: string;
  logo_url?: string;
  is_testnet: boolean;
}

export const SUPPORTED_CHAINS: Chain[] = [
  {
    id: 1,
    name: "Ethereum",
    symbol: "ETH",
    rpc_url: "https://eth-mainnet.g.alchemy.com/v2",
    explorer_url: "https://etherscan.io",
    is_testnet: false,
  },
  {
    id: 8453,
    name: "Base",
    symbol: "ETH",
    rpc_url: "https://base-mainnet.g.alchemy.com/v2",
    explorer_url: "https://basescan.org",
    is_testnet: false,
  },
  {
    id: 137,
    name: "Polygon",
    symbol: "MATIC",
    rpc_url: "https://polygon-mainnet.g.alchemy.com/v2",
    explorer_url: "https://polygonscan.com",
    is_testnet: false,
  },
  {
    id: 42161,
    name: "Arbitrum",
    symbol: "ETH",
    rpc_url: "https://arb-mainnet.g.alchemy.com/v2",
    explorer_url: "https://arbiscan.io",
    is_testnet: false,
  },
  {
    id: 11155111,
    name: "Sepolia",
    symbol: "ETH",
    rpc_url: "https://eth-sepolia.g.alchemy.com/v2",
    explorer_url: "https://sepolia.etherscan.io",
    is_testnet: true,
  },
];
