import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import { config } from "@/lib/config";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

const AUTH_TOKEN_KEY = "zoan_access_token";
const REFRESH_TOKEN_KEY = "zoan_refresh_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  let deviceId = localStorage.getItem("zoan_device_id");
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("zoan_device_id", deviceId);
  }
  return deviceId;
}

export function getFingerprint(): string {
  if (typeof window === "undefined") return "server";
  // Simple fingerprint based on browser info
  const nav = window.navigator;
  const screen = window.screen;
  const fingerprint = [
    nav.userAgent,
    nav.language,
    screen.colorDepth,
    screen.width + "x" + screen.height,
    new Date().getTimezoneOffset(),
  ].join("|");
  return btoa(fingerprint).substring(0, 32);
}

// Logout handler for 401 responses (set by auth store to avoid circular imports)
let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(handler: () => void): void {
  onUnauthorized = handler;
}

let isLoggingOut = false;

function handleUnauthorized(): void {
  if (isLoggingOut) return;
  isLoggingOut = true;
  clearTokens();
  if (onUnauthorized) {
    onUnauthorized();
  } else {
    window.location.href = "/login";
  }
  // Keep the guard up briefly to prevent concurrent 401s from re-triggering
  setTimeout(() => { isLoggingOut = false; }, 1000);
}

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

          const token = response.data?.data?.token ?? response.data?.token;
          if (token?.access_token) {
            setAccessToken(token.access_token);
            if (token.refresh_token) {
              setRefreshToken(token.refresh_token);
            }

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token.access_token}`;
            }
            return api(originalRequest);
          }

          // Refresh response didn't contain a valid token
          handleUnauthorized();
          return Promise.reject(error);
        } catch (refreshError) {
          handleUnauthorized();
          return Promise.reject(refreshError);
        }
      } else {
        handleUnauthorized();
      }
    }

    return Promise.reject(error);
  }
);

export { api };
export type { ApiResponse };
