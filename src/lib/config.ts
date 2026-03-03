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
  173: "0x37CCd90ed5FA96207B41C4fBCB90b883e30e63DC",
  // ENI Testnet
  174: "0x6741B16197ab5575d5A8C904159d4ef80ee1e6Bf",
};

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
