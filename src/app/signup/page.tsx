"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authService } from "@/services/auth";
import { LoadingButton } from "@/components/ui/loading-button";
import { FormInput } from "@/components/ui/form-input";
import { AuthLayout } from "@/components/auth/auth-layout";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email");
      return;
    }

    setIsLoading(true);
    try {
      await authService.initiateLogin(email);
      router.push(`/login/otp?email=${encodeURIComponent(email)}`);
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("Failed to send verification code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Zoan account"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[#27CEC5] hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <SocialLoginButtons />

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your personal email or work email"
          disabled={isLoading}
        />

        <LoadingButton type="submit" isLoading={isLoading} loadingText="Sending code...">
          Sign up
        </LoadingButton>
      </form>
    </AuthLayout>
  );
}
