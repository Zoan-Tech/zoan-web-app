import { api, getDeviceId, getFingerprint, setAccessToken, setRefreshToken, clearTokens } from "@/lib/api";
import {
  LoginInitiateRequest,
  LoginVerifyRequest,
  VerifyLoginResponse,
  User,
  ProfileCompleteRequest,
  Session,
  LogoutRequest,
} from "@/types/auth";

export const authService = {
  async initiateLogin(email: string): Promise<void> {
    const request: LoginInitiateRequest = {
      email,
      device_id: getDeviceId(),
      device_type: "web",
      fingerprint: getFingerprint(),
    };
    await api.post("/auth/login/initiate", request);
  },

  async verifyLogin(email: string, code: string): Promise<VerifyLoginResponse> {
    const request: LoginVerifyRequest = {
      email,
      code,
      device_id: getDeviceId(),
      fingerprint: getFingerprint(),
    };
    const response = await api.post("/auth/login/verify", request);
    
    if (response.data.success) {
      const data = response.data.data as VerifyLoginResponse;
      setAccessToken(data.token.access_token);
      if (data.token.refresh_token) {
        setRefreshToken(data.token.refresh_token);
      }
      return data;
    }
    throw new Error(response.data.message || "Verification failed");
  },

  async completeProfile(data: ProfileCompleteRequest, avatar?: File): Promise<User> {
    const formData = new FormData();
    formData.append("username", data.username);
    formData.append("display_name", data.display_name);
    formData.append("bio", data.bio);
    if (avatar) {
      formData.append("avatar", avatar);
    }
    const response = await api.post("/auth/profile/complete", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (response.data.success) {
      return response.data.data as User;
    }
    throw new Error(response.data.message || "Profile completion failed");
  },

  async getUser(): Promise<User> {
    const response = await api.get("/users/me");
    if (response.data.success) {
      const data = response.data.data;
      return { ...data, id: data.user_id || data.id };
    }
    throw new Error(response.data.message || "Failed to get user");
  },

  async resendOtp(email: string): Promise<void> {
    const response = await api.post("/auth/login/resend", {
      email,
      device_id: getDeviceId(),
    });
    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to resend OTP");
    }
  },

  async checkUsername(username: string): Promise<boolean> {
    const response = await api.get("/auth/check-username", {
      params: { username },
    });
    if (response.data.success) {
      return response.data.data.available ?? false;
    }
    return false;
  },

  async getSessions(): Promise<Session[]> {
    const response = await api.get("/auth/sessions");
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Failed to get sessions");
  },

  async logout(): Promise<void> {
    const request: LogoutRequest = {
      device_id: getDeviceId(),
    };
    try {
      await api.post("/auth/logout", request);
    } finally {
      clearTokens();
    }
  },

  async revokeSession(sessionId: string): Promise<void> {
    const response = await api.delete(`/auth/sessions/${sessionId}`);
    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to revoke session");
    }
  },
};
