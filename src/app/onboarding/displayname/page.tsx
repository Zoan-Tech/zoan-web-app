"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/auth";
import { useAuthStore } from "@/stores/auth";
import { CheckIcon } from "@phosphor-icons/react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { LoadingButton } from "@/components/ui/loading-button";
import { FormInput } from "@/components/ui/form-input";
import { OnboardingLayout } from "@/components/auth/onboarding-layout";

function DisplaynameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const username = searchParams.get("username") || "";
  const { checkAuth } = useAuthStore();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
      toast.error("Please enter a display name");
      return;
    }

    setIsLoading(true);
    try {
      await authService.completeProfile({
        username,
        display_name: displayName,
        bio: bio || "",
      });
      await checkAuth();
      router.replace("/");
    } catch (error) {
      console.error("Profile completion error:", error);
      toast.error("Failed to complete profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingLayout
      title="Complete your profile"
      subtitle="Tell us a bit about yourself"
      currentStep={2}
      totalSteps={2}
      backHref="/onboarding/username"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          id="displayName"
          label="Display Name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
          maxLength={50}
          disabled={isLoading}
        />

        <div>
          <label
            htmlFor="bio"
            className="block text-sm font-medium text-gray-700"
          >
            Bio (optional)
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself..."
            maxLength={160}
            rows={3}
            className="mt-1 w-full resize-none rounded-lg border border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-[#27CEC5] focus:outline-none focus:ring-2 focus:ring-[#27CEC5]/20"
            disabled={isLoading}
          />
          <p className="mt-1 text-right text-xs text-gray-400">
            {bio.length}/160
          </p>
        </div>

        <LoadingButton
          type="submit"
          isLoading={isLoading}
          loadingText="Completing profile..."
          disabled={!displayName.trim()}
        >
          Complete Setup
          <CheckIcon className="h-5 w-5" />
        </LoadingButton>
      </form>
    </OnboardingLayout>
  );
}

export default function DisplaynamePage() {
  return (
    <Suspense fallback={<LoadingSpinner size="lg" fullScreen />}>
      <DisplaynameContent />
    </Suspense>
  );
}
