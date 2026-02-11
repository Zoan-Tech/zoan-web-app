"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/auth";
import { useAuthStore } from "@/stores/auth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { LoadingButton } from "@/components/ui/loading-button";
import { OnboardingLayout } from "@/components/auth/onboarding-layout";

function OtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const { checkAuth } = useAuthStore();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      router.replace("/login");
    }
  }, [email, router]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const values = value.slice(0, 6).split("");
      const newOtp = [...otp];
      values.forEach((v, i) => {
        if (index + i < 6) {
          newOtp[index + i] = v;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + values.length, 5);
      inputRefs.current[nextIndex]?.focus();
    } else {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    const code = otp.join("");

    if (code.length !== 6) {
      toast.error("Please enter the complete verification code");
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.verifyLogin(email, code);
      await checkAuth();

      if (response.is_new_user || !response.user.username) {
        router.replace("/onboarding/username");
      } else {
        router.replace("/");
      }
    } catch (error) {
      console.error("Verify error:", error);
      toast.error("Invalid verification code. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  }, [otp, email, checkAuth, router]);

  const handleResend = async () => {
    setIsResending(true);
    try {
      await authService.resendOtp(email);
      setCountdown(60);
      toast.success("Verification code resent!");
    } catch (error) {
      console.error("Resend error:", error);
      toast.error("Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  // Auto-submit when all digits are entered
  useEffect(() => {
    if (otp.every((digit) => digit !== "") && !isLoading) {
      handleSubmit();
    }
  }, [otp, isLoading, handleSubmit]);

  return (
    <OnboardingLayout
      title="Check your email"
      subtitle={
        <>
          We sent a verification code to{" "}
          <span className="font-medium text-gray-900">{email}</span>
        </>
      }
      backHref="/login"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center gap-3">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="h-14 w-12 rounded-lg border border-gray-200 text-center text-xl font-semibold text-gray-900 focus:border-[#27CEC5] focus:outline-none focus:ring-2 focus:ring-[#27CEC5]/20"
              disabled={isLoading}
            />
          ))}
        </div>

        <LoadingButton
          type="submit"
          isLoading={isLoading}
          loadingText="Verifying..."
          disabled={otp.some((d) => !d)}
        >
          Verify
        </LoadingButton>
      </form>

      <div className="mt-4 text-center">
        {countdown > 0 ? (
          <p className="text-sm text-gray-500">
            Resend code in {countdown}s
          </p>
        ) : (
          <button
            onClick={handleResend}
            disabled={isResending}
            className="text-sm font-medium text-[#27CEC5] hover:underline disabled:opacity-50"
          >
            {isResending ? "Resending..." : "Resend verification code"}
          </button>
        )}
      </div>
    </OnboardingLayout>
  );
}

export default function OtpPage() {
  return (
    <Suspense fallback={<LoadingSpinner size="lg" fullScreen />}>
      <OtpContent />
    </Suspense>
  );
}
