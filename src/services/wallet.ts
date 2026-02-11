import { api } from "@/lib/api";

export interface WalletAuthResponse {
  token: string;
}

export interface StoreWalletRequest {
  wallet_address: string;
  privy_did: string;
}

export const walletService = {
  async getWalletAuth(): Promise<string> {
    const response = await api.get("/wallet/auth");
    if (response.data.success) {
      return response.data.data.token;
    }
    throw new Error(response.data.message || "Failed to get wallet auth");
  },

  async storeWallet(walletAddress: string, privyDid: string): Promise<void> {
    const response = await api.post("/wallet/store", {
      wallet_address: walletAddress,
      privy_did: privyDid,
    });
    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to store wallet");
    }
  },

  async getWallet(): Promise<{ address: string; privy_did: string } | null> {
    try {
      const response = await api.get("/wallet");
      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch {
      return null;
    }
  },
};
