export const config = {
  // Client-side calls go through Next.js API routes
  apiUrl: "/api",
  minioUrl: process.env.NEXT_PUBLIC_MINIO_URL || "http://localhost:9000",
  privy: {
    appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID || "cmkcd09o4027njy0dyn0ktjel",
  },
  alchemy: {
    apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || "5qEKJVwYrUpB8HQZiPodL",
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
export const ENI_SWAP_ROUTERS: Record<number, string> = {};

export const alchemyRpcUrls: Record<number, string> = {
  // Mainnets
  1: `https://eth-mainnet.g.alchemy.com/v2/${config.alchemy.apiKey}`,
  137: `https://polygon-mainnet.g.alchemy.com/v2/${config.alchemy.apiKey}`,
  42161: `https://arb-mainnet.g.alchemy.com/v2/${config.alchemy.apiKey}`,
  10: `https://opt-mainnet.g.alchemy.com/v2/${config.alchemy.apiKey}`,
  8453: `https://base-mainnet.g.alchemy.com/v2/${config.alchemy.apiKey}`,
  56: `https://bnb-mainnet.g.alchemy.com/v2/${config.alchemy.apiKey}`,
  // Testnets
  11155111: `https://eth-sepolia.g.alchemy.com/v2/${config.alchemy.apiKey}`,
  421614: `https://arb-sepolia.g.alchemy.com/v2/${config.alchemy.apiKey}`,
  84532: `https://sepolia.base.org`,
};
