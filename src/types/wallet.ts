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
  swap_router_address?: string; // ENI custom DEX router (Uniswap v2-compatible)
}

export const SUPPORTED_CHAINS: Chain[] = [
  // Mainnets
  {
    id: 1,
    name: "Ethereum",
    symbol: "ETH",
    rpc_url: "https://ethereum-rpc.publicnode.com",
    explorer_url: "https://etherscan.io",
    logo_url: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
    is_testnet: false,
  },
  {
    id: 137,
    name: "Polygon",
    symbol: "MATIC",
    rpc_url: "https://polygon-rpc.com",
    explorer_url: "https://polygonscan.com",
    logo_url: "https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png",
    is_testnet: false,
  },
  {
    id: 8453,
    name: "Base",
    symbol: "ETH",
    rpc_url: "https://mainnet.base.org",
    explorer_url: "https://basescan.org",
    logo_url: "https://s2.coinmarketcap.com/static/img/coins/64x64/9195.png",
    is_testnet: false,
  },
  {
    id: 10,
    name: "Optimism",
    symbol: "ETH",
    rpc_url: "https://mainnet.optimism.io",
    explorer_url: "https://optimistic.etherscan.io",
    logo_url: "https://s2.coinmarketcap.com/static/img/coins/64x64/11840.png",
    is_testnet: false,
  },
  {
    id: 42161,
    name: "Arbitrum",
    symbol: "ETH",
    rpc_url: "https://arb1.arbitrum.io/rpc",
    explorer_url: "https://arbiscan.io",
    logo_url: "https://s2.coinmarketcap.com/static/img/coins/64x64/11841.png",
    is_testnet: false,
  },
  {
    id: 56,
    name: "BSC",
    symbol: "BNB",
    rpc_url: "https://bsc-dataseed.binance.org",
    explorer_url: "https://bscscan.com",
    logo_url: "https://s2.coinmarketcap.com/static/img/coins/64x64/1839.png",
    is_testnet: false,
  },
  {
    id: 173,
    name: "ENI Mainnet",
    symbol: "EGAS",
    rpc_url: "https://rpc.eniac.network",
    explorer_url: "https://scan.eniac.network",
    logo_url: "https://s2.coinmarketcap.com/static/img/coins/64x64/36784.png",
    is_testnet: false,
  },
  // Testnets
  {
    id: 11155111,
    name: "Sepolia",
    symbol: "ETH",
    rpc_url: "https://rpc.sepolia.org",
    explorer_url: "https://sepolia.etherscan.io",
    logo_url: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
    is_testnet: true,
  },
  {
    id: 84532,
    name: "Base Sepolia",
    symbol: "ETH",
    rpc_url: "https://sepolia.base.org",
    explorer_url: "https://sepolia.basescan.org",
    logo_url: "https://s2.coinmarketcap.com/static/img/coins/64x64/9195.png",
    is_testnet: true,
  },
  {
    id: 421614,
    name: "Arbitrum Sepolia",
    symbol: "ETH",
    rpc_url: "https://sepolia-rollup.arbitrum.io/rpc",
    explorer_url: "https://sepolia.arbiscan.io",
    logo_url: "https://s2.coinmarketcap.com/static/img/coins/64x64/11841.png",
    is_testnet: true,
  },
  {
    id: 174,
    name: "ENI Testnet",
    symbol: "EGAS",
    rpc_url: "https://rpc-testnet.eniac.network",
    explorer_url: "https://scan-testnet.eniac.network",
    logo_url: "https://s2.coinmarketcap.com/static/img/coins/64x64/36784.png",
    is_testnet: true,
  },
];
