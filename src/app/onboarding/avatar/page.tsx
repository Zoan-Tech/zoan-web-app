"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { PlusIcon } from "@phosphor-icons/react";
import { authService } from "@/services/auth";
import { useAuthStore } from "@/stores/auth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { LoadingButton } from "@/components/ui/loading-button";
import { OnboardingLayout } from "@/components/auth/onboarding-layout";
import { OnboardingSplash } from "@/components/auth/onboarding-splash";

const AVATAR_STORAGE_KEY = "zoan-onboarding-avatar";

function dataURLtoFile(dataUrl: string, filename: string): File {
  const [header, data] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] || "image/png";
  const bytes = atob(data);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    arr[i] = bytes.charCodeAt(i);
  }
  return new File([arr], filename, { type: mime });
}

function AvatarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const username = searchParams.get("username") || "";
  const displayName = searchParams.get("displayname") || "";
  const { setUser, setStatus } = useAuthStore();

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSplashComplete = useCallback(() => {
    router.replace("/");
  }, [router]);

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Restore avatar from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(AVATAR_STORAGE_KEY);
    if (saved) {
      setAvatarPreview(saved);
    }
  }, []);

  if (showSplash) {
    return <OnboardingSplash onComplete={handleSplashComplete} />;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setAvatarPreview(dataUrl);
      localStorage.setItem(AVATAR_STORAGE_KEY, dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Convert saved avatar from localStorage
      const avatarFile = avatarPreview
        ? dataURLtoFile(avatarPreview, "avatar.png")
        : undefined;

      // Single call to complete profile with all collected data
      const user = await authService.completeProfile(
        { username, display_name: displayName },
        avatarFile
      );

      // Clean up localStorage
      localStorage.removeItem(AVATAR_STORAGE_KEY);

      setUser(user);
      setStatus("authenticated");
      setShowSplash(true);
    } catch (error) {
      console.error("Profile completion error:", error);
      toast.error("Failed to complete profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingLayout
      title="Add an avatar"
      subtitle="Choose an image to represent you and personalise your profile"
      backHref={`/onboarding/displayname?username=${encodeURIComponent(username)}`}
    >
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
        {/* Avatar picker */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative"
          >
            {avatarPreview ? (
              <div className="h-28 w-28 overflow-hidden rounded-2xl">
                <Image
                  src={avatarPreview}
                  alt="Avatar preview"
                  width={112}
                  height={112}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-[#27CEC5] text-3xl font-bold text-white">
                {initials || "?"}
              </div>
            )}
            {/* Plus badge */}
            <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#27CEC5] text-white shadow-md">
              <PlusIcon className="h-4 w-4" weight="bold" />
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        <LoadingButton
          type="submit"
          isLoading={isLoading}
          loadingText="Setting up..."
          className="mt-auto"
        >
          Continue
        </LoadingButton>
      </form>
    </OnboardingLayout>
  );
}

export default function AvatarPage() {
  return (
    <Suspense fallback={<LoadingSpinner size="lg" fullScreen />}>
      <AvatarContent />
    </Suspense>
  );
}
