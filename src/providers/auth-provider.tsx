"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { SplashScreen } from "@/components/ui/splash-screen";

interface Props {
  children: React.ReactNode;
}

const PUBLIC_PATHS = ["/login", "/login/otp"];
const ONBOARDING_PATHS = ["/onboarding/username", "/onboarding/displayname"];

export function AuthProvider({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isLoading) return;

    const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
    const isOnboardingPath = ONBOARDING_PATHS.some((p) =>
      pathname.startsWith(p)
    );

    if (status === "unauthenticated" && !isPublicPath) {
      router.replace("/login");
    } else if (status === "authenticated" && (isPublicPath || isOnboardingPath)) {
      router.replace("/");
    } else if (status === "onboarding_required" && !isOnboardingPath) {
      router.replace("/onboarding/username");
    }
  }, [status, isLoading, pathname, router]);

  // Show splash screen while checking auth
  if (isLoading) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}
