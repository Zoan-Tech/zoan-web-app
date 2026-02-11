export const NETWORK_COLORS: Record<number, string> = {
  1: "#627EEA",     // Ethereum
  8453: "#0052FF",  // Base
  56: "#F3BA2F",    // BSC
  137: "#8247E5",   // Polygon
  42161: "#28A0F0", // Arbitrum
  10: "#FF0420",    // Optimism
};

export function getNetworkColor(chainId: number): string {
  return NETWORK_COLORS[chainId] ?? "#27CEC5";
}
