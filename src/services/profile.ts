import { api } from "@/lib/api";
import { User } from "@/types/auth";

export interface UpdateProfileRequest {
  username?: string;
  display_name?: string;
  bio?: string;
  avatar?: File;
  banner?: File;
  location?: string;
  website?: string;
}

export const profileService = {
  async getProfile(userId?: string): Promise<User> {
    const endpoint = userId ? `/users/${userId}` : "/users/me";
    const response = await api.get(endpoint);
    if (response.data.success) {
      const data = response.data.data;
      return { ...data, id: data.user_id || data.id };
    }
    throw new Error(response.data.message || "Failed to fetch profile");
  },

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const hasFile = data.avatar instanceof File || data.banner instanceof File;
    let payload: UpdateProfileRequest | FormData = data;

    if (hasFile) {
      const formData = new FormData();
      if (data.display_name !== undefined) formData.append("display_name", data.display_name);
      if (data.bio !== undefined) formData.append("bio", data.bio);
      if (data.location !== undefined) formData.append("location", data.location);
      if (data.website !== undefined) formData.append("website", data.website);
      if (data.username !== undefined) formData.append("username", data.username);
      if (data.avatar instanceof File) formData.append("avatar", data.avatar);
      if (data.banner instanceof File) formData.append("banner", data.banner);
      payload = formData;
    }

    const response = await api.put("/users/me", payload, hasFile ? { headers: { "Content-Type": "multipart/form-data" } } : undefined);
    if (response.data.success) {
      const data = response.data.data;
      return { ...data, id: data.user_id || data.id };
    }
    throw new Error(response.data.message || "Failed to update profile");
  },

  async followUser(userId: string): Promise<void> {
    await api.post(`/social/follow/${userId}`);
  },

  async unfollowUser(userId: string): Promise<void> {
    await api.delete(`/social/follow/${userId}`);
  },

  async getFollowers(userId: string, page: number = 1): Promise<User[]> {
    const response = await api.get(`/followers/${userId}`, {
      params: { page, per_page: 20 },
    });
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Failed to fetch followers");
  },

  async getFollowing(userId: string, page: number = 1): Promise<User[]> {
    const response = await api.get(`/following/${userId}`, {
      params: { page, per_page: 20 },
    });
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Failed to fetch following");
  },

  async searchUsers(query: string, limit: number = 10): Promise<User[]> {
    try {
      const response = await api.get("/users/search", {
        params: { q: query, limit },
      });
      if (response.data.success) {
        return response.data.data;
      }
      return [];
    } catch {
      return [];
    }
  },
};
