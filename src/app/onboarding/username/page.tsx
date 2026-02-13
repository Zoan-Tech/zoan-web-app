"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/auth";
import { SpinnerGapIcon, CheckCircleIcon } from "@phosphor-icons/react";
import { LoadingButton } from "@/components/ui/loading-button";
import { OnboardingLayout } from "@/components/auth/onboarding-layout";

export default function UsernamePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!username || username.length < 3) {
      setIsAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsChecking(true);
      try {
        const available = await authService.checkUsername(username);
        setIsAvailable(available);
      } catch (error) {
        console.error("Username check error:", error);
      } finally {
        setIsChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || username.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }

    if (!isAvailable) {
      toast.error("This username is not available");
      return;
    }

    router.push(`/onboarding/displayname?username=${encodeURIComponent(username)}`);
  };

  const isValidUsername = /^[a-zA-Z0-9_]+$/.test(username);

  return (
    <OnboardingLayout
      title="Choose username"
      subtitle="Choose your unique zoan handle"
    >
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <div>
          <div className="relative">
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="username"
              className="w-full rounded-lg border border-gray-200 py-3 px-4 text-gray-900 placeholder:text-gray-400 focus:border-[#27CEC5] focus:outline-none focus:ring-2 focus:ring-[#27CEC5]/20"
            />
            {username.length >= 3 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isChecking ? (
                  <SpinnerGapIcon className="h-5 w-5 animate-spin text-gray-400" />
                ) : isAvailable === true ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" weight="fill" />
                ) : isAvailable === false ? (
                  <span className="text-xs text-red-500">Taken</span>
                ) : null}
              </div>
            )}
          </div>
          {isAvailable === true && username.length >= 3 && (
            <p className="mt-1.5 flex items-center gap-1 text-sm text-green-600">
              <CheckCircleIcon className="h-4 w-4" weight="fill" />
              {username} is available
            </p>
          )}
          {username && !isValidUsername && (
            <p className="mt-1.5 text-sm text-red-500">
              Only letters, numbers, and underscores allowed
            </p>
          )}
          {isAvailable === false && (
            <p className="mt-1.5 text-sm text-red-500">
              This username is already taken
            </p>
          )}
        </div>

        <LoadingButton
          type="submit"
          isLoading={false}
          disabled={!isAvailable || !isValidUsername}
          className="mt-auto"
        >
          Continue
        </LoadingButton>
      </form>
    </OnboardingLayout>
  );
}
