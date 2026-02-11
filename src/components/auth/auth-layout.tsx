import { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

interface AuthLayoutProps {
  title: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthLayout({ title, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[#E0FAF8]">
      {/* Left Side - Form */}
      <div className="flex w-full flex-col justify-between bg-white p-8 lg:w-1/2">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Zoan"
            width={32}
            height={32}
            priority
          />
          <span className="text-xl font-semibold text-gray-900">zoan</span>
        </div>

        {/* Form Container */}
        <div className="mx-auto w-full max-w-sm">
          <h1 className="mb-8 text-center text-2xl font-semibold text-gray-900">
            {title}
          </h1>

          {children}

          {/* Footer link */}
          <div className="mt-6 text-center text-sm text-gray-600">
            {footer}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between text-sm text-gray-500">
          <Link href="/terms" className="hover:text-gray-700">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-gray-700">
            Privacy & Policies
          </Link>
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div className="hidden lg:block lg:w-1/2">
        <div className="relative h-full w-full">
          <Image
            src="/images/login_image.svg"
            alt="Zoan illustration"
            fill
            className="object-cover"
            priority
          />
        </div>
      </div>
    </div>
  );
}
