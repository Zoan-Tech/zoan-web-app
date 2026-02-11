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
};

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
