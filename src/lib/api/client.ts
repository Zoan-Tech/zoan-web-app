import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import { config } from "@/lib/config";
import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken, clearTokens } from "./token";
import { getDeviceId } from "./device";

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: config.apiUrl,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const response = await axios.post(`/api/auth/refresh`, {
            refresh_token: refreshToken,
            device_id: getDeviceId(),
          });

          if (response.data.success) {
            const { access_token, refresh_token } = response.data.data.token;
            setAccessToken(access_token);
            if (refresh_token) {
              setRefreshToken(refresh_token);
            }

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${access_token}`;
            }
            return api(originalRequest);
          }
        } catch (refreshError) {
          clearTokens();
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      } else {
        clearTokens();
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export { api };
