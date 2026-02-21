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

// ---------- Token refresh queue (mutex) ----------
// Only one refresh call runs at a time. Concurrent 401s queue behind the same
// promise so we never fire multiple refresh requests in parallel.
let refreshPromise: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    console.warn("[Auth] No refresh token found in localStorage — cannot refresh.");
    return null;
  }

  console.info("[Auth] Refreshing access token…");

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
    console.info("[Auth] Access token refreshed successfully.");
    return token.access_token as string;
  }

  console.warn("[Auth] Refresh response did not contain a valid access_token.", response.data);
  return null;
}

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // If a refresh is already in-flight, wait for it instead of starting a new one
        if (!refreshPromise) {
          refreshPromise = doRefresh().finally(() => {
            refreshPromise = null;
          });
        }

        const newAccessToken = await refreshPromise;

        if (newAccessToken) {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          return api(originalRequest);
        }

        // Refresh returned no token
        handleUnauthorized();
        return Promise.reject(error);
      } catch (refreshError) {
        console.error("[Auth] Token refresh failed:", refreshError);
        handleUnauthorized();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export { api };
export type { ApiResponse };
