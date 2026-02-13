import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, AuthStatus } from "@/types/auth";
import { authService } from "@/services/auth";
import { getAccessToken, clearTokens, setOnUnauthorized } from "@/lib/api";

interface AuthState {
  user: User | null;
  status: AuthStatus;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setStatus: (status: AuthStatus) => void;
  setError: (error: string | null) => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      status: "loading",
      isLoading: true,
      error: null,

      setUser: (user) => set({ user }),
      setStatus: (status) => set({ status }),
      setError: (error) => set({ error }),

      checkAuth: async () => {
        const token = getAccessToken();
        if (!token) {
          set({ status: "unauthenticated", isLoading: false, user: null });
          return;
        }

        // If we already have a user with a resolved status (e.g. set after onboarding),
        // skip the /users/me call and just clear loading
        const { user: existingUser, status: currentStatus } = useAuthStore.getState();
        if (existingUser && (currentStatus === "authenticated" || currentStatus === "onboarding_required")) {
          set({ isLoading: false });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const user = await authService.getUser();

          // Check if user needs to complete onboarding
          if (!user.username || !user.display_name) {
            set({ status: "onboarding_required", user, isLoading: false });
          } else {
            set({ status: "authenticated", user, isLoading: false });
          }
        } catch (error) {
          console.error("Auth check failed:", error);
          clearTokens();
          set({ status: "unauthenticated", user: null, isLoading: false });
        }
      },

      logout: async () => {
        try {
          const token = getAccessToken();
          if (token) {
            await authService.logout();
          }
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          clearTokens();
          set({ user: null, status: "unauthenticated" });
        }
      },

      refreshUser: async () => {
        try {
          const user = await authService.getUser();
          set({ user });
        } catch (error) {
          console.error("Failed to refresh user:", error);
        }
      },
    }),
    {
      name: "zoan-auth",
      partialize: (state) => ({ user: state.user }),
    }
  )
);

// Register the 401 handler so API interceptor can trigger logout without circular imports
setOnUnauthorized(() => {
  const { logout } = useAuthStore.getState();
  logout();
});
