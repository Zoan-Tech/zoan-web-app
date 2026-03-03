export const config = {
  // Client-side calls go through Next.js API routes
  apiUrl: "/api",
  minioUrl: process.env.NEXT_PUBLIC_MINIO_URL || "http://localhost:9000",
  privy: {
    appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID || "",
  },
  alchemy: {
    apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "",
  },
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "",
  },
  zeroEx: {
    apiKey: process.env.NEXT_PUBLIC_ZERO_X_API_KEY || "",
  },
};

// ENI chain IDs mapped to their Uniswap v2-compatible router addresses.
// Add entries here when a new ENI chain is supported.
export const ENI_SWAP_ROUTERS: Record<number, string> = {
  // ENI Mainnet
  173: "0x97ED8bE49D9A8B86247090Aa41E908E76B8fcF22",
  // ENI Testnet
  174: "0x97ED8bE49D9A8B86247090Aa41E908E76B8fcF22",
};

export const ENI_TOKENS = [
  { chainId: 173, symbol: "USDT", name: "USDT", address: "0xdc1a8a35b0baa3229b13f348ed708a2fd50b5e3a", decimals: 18, logoURI: "" },
  { chainId: 173, symbol: "WEGAS", name: "WEGAS", address: "0x6d1e851446f4d004ae2a72f9afed85e8829a205e", decimals: 18, logoURI: "" },
  { chainId: 173, symbol: "Bridged USDT", name: "Bridged USDT", address: "0x47c98f74dbc1acc4cf2e04c4a729e22379ef4373", decimals: 18, logoURI: "" },
  { chainId: 173, symbol: "MMX", name: "MMX", address: "0xf124b927777d1d72de87c7c5f4f1287c4809c7db", decimals: 18, logoURI: "" },
  { chainId: 173, symbol: "YOCHI", name: "YOCHI", address: "0xaa3b0c4527c3085251b2bf9e48bb4cf9a533f879", decimals: 18, logoURI: "" },
  { chainId: 173, symbol: "YOC", name: "YOC", address: "0x98a2a98fc674ad531bd2c5d75a2d60b36bfb2872", decimals: 18, logoURI: "" },
  { chainId: 173, symbol: "ENIDOG", name: "ENIDOG", address: "0xddd0b3ca34da2a8beca3ed76e8275e57c80ff814", decimals: 18, logoURI: "" },
  { chainId: 173, symbol: "ENIMZ", name: "ENIMZ", address: "0x9045f64eb82559ef9a62694de66446837df9a6b5", decimals: 18, logoURI: "" },
  { chainId: 173, symbol: "ZC", name: "ZC", address: "0x11584c874050593c0ed46e2522c52cb4e0882079", decimals: 18, logoURI: "" },
  { chainId: 173, symbol: "ZENI", name: "ZENI", address: "0x9febf6a54824dd8fbd15ed82b504638250b0a30f", decimals: 18, logoURI: "" },
  { chainId: 173, symbol: "NUWA", name: "NUWA", address: "0xa18cec0bdde4696b42c813a1575ba7a417a9fb9b", decimals: 18, logoURI: "" },
  { chainId: 173, symbol: "ZING", name: "ZING", address: "0x02de5accb417cd3748f309138d9f15f3b1a84058", decimals: 18, logoURI: "" },
  { chainId: 173, symbol: "ZQBTC", name: "ZQBTC", address: "0x447e610448839d3d0c09398efd898cbc43f095ff", decimals: 18, logoURI: "" },
  { chainId: 173, symbol: "FA", name: "FA", address: "0xbff9cc320ba5411f92b4fd16b861ee1f45fe6610", decimals: 18, logoURI: "" },
  { chainId: 173, symbol: "MEX", name: "MEX", address: "0x6546641426d1cc7c3384128f6c728616bd3e37a8", decimals: 18, logoURI: "" },
  { chainId: 173, symbol: "PANGU", name: "PANGU", address: "0x6c61adf9577ba7362e578bfb812ddd885d0cb276", decimals: 18, logoURI: "" },
  { chainId: 173, symbol: "UP", name: "UP", address: "0x3345e9e1667b10428be33ece30af13b5db1217e9", decimals: 18, logoURI: "" },
  { chainId: 173, symbol: "LEI", name: "LEI", address: "0x96d845939bdc07fafb857494e967173616344164", decimals: 18, logoURI: "" },
  { chainId: 173, symbol: "PG", name: "PG", address: "0xebb8fb4f13a7382c1c4e387b012d3a4561f82665", decimals: 18, logoURI: "" },
  { chainId: 173, symbol: "EVE", name: "EVE", address: "0x25a97f0c14858ae30fe72aabf8e78ce3941abd79", decimals: 18, logoURI: "" },
  { chainId: 173, symbol: "ADAM", name: "ADAM", address: "0x9fddb7445fda28a37b14e51d0cecd1d47b09eb4c", decimals: 18, logoURI: "" },
  { chainId: 173, symbol: "SPORE", name: "SPORE", address: "0xb8d2d8cba1ff567c179dadee4a74e362c30e6cfa", decimals: 18, logoURI: "" },
  { chainId: 173, symbol: "ZALA", name: "ZALA", address: "0x8609374ca319e8a593e6d524b9fbc1744db721d1", decimals: 18, logoURI: "" },
  { chainId: 173, symbol: "TKD", name: "TKD", address: "0xd88f75c60709059771de60cde0187db687f42cf3", decimals: 18, logoURI: "" },
  { chainId: 173, symbol: "DOK", name: "DOK", address: "0x758446cc215d046877cae9524f8f6af132cd1ac9", decimals: 18, logoURI: "" },
  { chainId: 173, symbol: "DONE", name: "DONE", address: "0x1e54c33038680e5cde5900d1aa7f5c74566f13bf", decimals: 18, logoURI: "" },
  { chainId: 173, symbol: "KINGDOG", name: "KINGDOG", address: "0x328148ac3aa1cbfe7a0b60fe46e1b3189bb61bb3", decimals: 18, logoURI: "" },
  { chainId: 173, symbol: "MZP", name: "MZP", address: "0xc6c1631312eea54549dba07667f410cda0a748a4", decimals: 18, logoURI: "" },
  { chainId: 173, symbol: "MZPT", name: "MZPT", address: "0x4a7d83992286f5dbf55628b36950a3137fc41f26", decimals: 18, logoURI: "" },
  { chainId: 173, symbol: "MELEX", name: "MELEX", address: "0x20162421c4b9e37ba08da2cffed3b4389121e33b", decimals: 18, logoURI: "" },
  { chainId: 173, symbol: "FOX", name: "FOX", address: "0x32ff5ca0b271873ab51794714ec637e17c13754d", decimals: 18, logoURI: "" },
  { chainId: 173, symbol: "TCY", name: "TCY", address: "0x03dc48e455f2e9b52c00d3496a0aab7471929373", decimals: 18, logoURI: "" },
  { chainId: 173, symbol: "SHOVEL", name: "SHOVEL", address: "0xc09883c3f121ab690365adb5356600eca92557f0", decimals: 18, logoURI: "" }
];

// ENI RPC URLs used for server-side swap quoting.
// Note: other RPC traffic is routed via the backend Chain API in /api/rpc.
export const ENI_RPC_URLS: Record<number, string> = {
  173: "https://rpc.eniac.network",
  174: "https://rpc-testnet.eniac.network",
};

const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "";

// Fallback RPC URLs used by server routes when backend /chains is unavailable
// (e.g. unauthenticated requests in local/dev).
export const FALLBACK_RPC_URLS: Record<number, string> = (() => {
  const urls: Record<number, string> = {
    // Public fallback endpoints
    56: "https://bsc-dataseed.binance.org",
    84532: "https://sepolia.base.org",
    ...ENI_RPC_URLS,
  };

  if (alchemyApiKey) {
    urls[1] = `https://eth-mainnet.g.alchemy.com/v2/${alchemyApiKey}`;
    urls[137] = `https://polygon-mainnet.g.alchemy.com/v2/${alchemyApiKey}`;
    urls[42161] = `https://arb-mainnet.g.alchemy.com/v2/${alchemyApiKey}`;
    urls[10] = `https://opt-mainnet.g.alchemy.com/v2/${alchemyApiKey}`;
    urls[8453] = `https://base-mainnet.g.alchemy.com/v2/${alchemyApiKey}`;
    urls[11155111] = `https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`;
    urls[421614] = `https://arb-sepolia.g.alchemy.com/v2/${alchemyApiKey}`;
  }

  return urls;
})();

// Wrapped native token addresses for ENI chains (used for router swap paths).
export const ENI_WRAPPED_NATIVE: Record<number, string> = {
  // ENI Mainnet: WEGAS
  173: "0x6D1e851446F4D004AE2A72F9AfEd85e8829A205E",
  // ENI Testnet: WETH (wrapped native on testnet)
  174: "0xd2F3aA0e87169027E3ED09194181474c50132C4B",
};

// [DISABLED] Hardcoded Alchemy RPC URLs — replaced by backend rpc_providers.
// Kept here as a reference / fallback.
// export const alchemyRpcUrls: Record<number, string> = {
//   1: `https://eth-mainnet.g.alchemy.com/v2/${config.alchemy.apiKey}`,
//   137: `https://polygon-mainnet.g.alchemy.com/v2/${config.alchemy.apiKey}`,
//   42161: `https://arb-mainnet.g.alchemy.com/v2/${config.alchemy.apiKey}`,
//   10: `https://opt-mainnet.g.alchemy.com/v2/${config.alchemy.apiKey}`,
//   8453: `https://base-mainnet.g.alchemy.com/v2/${config.alchemy.apiKey}`,
//   56: `https://bnb-mainnet.g.alchemy.com/v2/${config.alchemy.apiKey}`,
//   11155111: `https://eth-sepolia.g.alchemy.com/v2/${config.alchemy.apiKey}`,
//   421614: `https://arb-sepolia.g.alchemy.com/v2/${config.alchemy.apiKey}`,
//   84532: `https://sepolia.base.org`,
// };
