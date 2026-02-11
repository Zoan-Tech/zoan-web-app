import { api } from "@/lib/api";

export interface WalletAuthResponse {
  token: string;
}

export const walletService = {
  async getWalletAuth(): Promise<string> {
    const response = await api.get("/wallet/auth");
    if (response.data.success) {
      return response.data.data.token;
    }
    throw new Error(response.data.message || "Failed to get wallet auth");
  },
};
