import { api } from "@/lib/api";
import { User } from "@/types/auth";

export interface UpdateProfileRequest {
  username?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
  location?: string;
  website?: string;
}

export const profileService = {
  async getProfile(userId?: string): Promise<User> {
    const endpoint = userId ? `/users/${userId}` : "/users/me";
    const response = await api.get(endpoint);
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || "Failed to fetch profile");
  },

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const response = await api.put("/users/me", data);
    if (response.data.success) {
      return response.data.data;
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

  async uploadAvatar(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/upload/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    if (response.data.success) {
      return response.data.data.url;
    }
    throw new Error(response.data.message || "Failed to upload avatar");
  },

  async uploadBanner(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/upload/banner", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    if (response.data.success) {
      return response.data.data.url;
    }
    throw new Error(response.data.message || "Failed to upload banner");
  },
};
