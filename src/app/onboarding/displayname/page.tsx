"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { LoadingButton } from "@/components/ui/loading-button";
import { OnboardingLayout } from "@/components/auth/onboarding-layout";

function DisplaynameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const username = searchParams.get("username") || "";

  const [displayName, setDisplayName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
      toast.error("Please enter a display name");
      return;
    }

    router.push(
      `/onboarding/avatar?username=${encodeURIComponent(username)}&displayname=${encodeURIComponent(displayName)}`
    );
  };

  return (
    <OnboardingLayout
      title="Set a display name"
      subtitle="Your display name is what others will see on your profile"
      backHref={`/onboarding/username`}
    >
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="displayName"
          maxLength={50}
          className="w-full rounded-lg border border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-[#27CEC5] focus:outline-none focus:ring-2 focus:ring-[#27CEC5]/20"
        />

        <LoadingButton
          type="submit"
          isLoading={false}
          disabled={!displayName.trim()}
          className="mt-auto"
        >
          Continue
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
