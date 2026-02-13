import { ReactNode } from "react";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";

interface OnboardingLayoutProps {
  title: string;
  subtitle?: ReactNode;
  backHref?: string;
  children: ReactNode;
}

export function OnboardingLayout({
  title,
  subtitle,
  backHref,
  children,
}: OnboardingLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white px-6 py-6">
      {/* Logo header */}
      <div className="flex items-center gap-2">
        <Image
          src="/logo.png"
          alt="Zoan"
          width={28}
          height={28}
          priority
        />
        <span className="text-lg font-semibold text-gray-900">zoan</span>
      </div>

      {/* Centered content */}
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-[640px]">
          {/* Back button */}
          {backHref && (
            <Link
              href={backHref}
              className="mb-4 inline-flex items-center text-gray-400 hover:text-gray-900"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </Link>
          )}

          {/* Card */}
          <div className="flex min-h-[726px] flex-col rounded-3xl border-2 border-[#D1D1D1] p-[50px]">
            {/* Header */}
            <div className="mb-6 text-center">
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
              {subtitle && (
                <p className="mt-1.5 text-sm text-gray-500">{subtitle}</p>
              )}
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
