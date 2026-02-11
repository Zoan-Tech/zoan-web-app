import { ReactNode } from "react";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import Link from "next/link";

interface OnboardingLayoutProps {
  title: string;
  subtitle: ReactNode;
  currentStep?: number;
  totalSteps?: number;
  backHref?: string;
  children: ReactNode;
}

export function OnboardingLayout({
  title,
  subtitle,
  currentStep = 0,
  totalSteps = 0,
  backHref,
  children,
}: OnboardingLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-[#E0FAF8] px-4">
      <div className="w-full max-w-md">
        {/* Progress */}
        {totalSteps > 0 && (
          <div className="mb-8 flex justify-center gap-2">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`h-2 w-12 rounded-full ${
                  i < currentStep ? "bg-[#27CEC5]" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        )}

        {/* Back button */}
        {backHref && (
          <Link
            href={backHref}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Back
          </Link>
        )}

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="mt-2 text-gray-600">{subtitle}</p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl bg-white p-6 shadow-lg">{children}</div>
      </div>
    </div>
  );
}
