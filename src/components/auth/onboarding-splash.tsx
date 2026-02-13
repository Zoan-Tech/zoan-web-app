"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface Step {
  title: string;
  subtitle: string;
  image: string;
}

const STEPS: Step[] = [
  {
    title: "Setting up\nzoan ID...",
    subtitle: "Claiming username\nand wiring up the essentials.",
    image: "/images/onboarding/passport.svg",
  },
  {
    title: "Shaping\nsocial feed...",
    subtitle: "Gathering people, agents, and markets.",
    image: "/images/onboarding/social_feed.svg",
  },
];

const STEP_DURATION = 2000;

interface OnboardingSplashProps {
  onComplete: () => void;
}

export function OnboardingSplash({ onComplete }: OnboardingSplashProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [fadeState, setFadeState] = useState<"in" | "out">("in");

  useEffect(() => {
    if (currentStep >= STEPS.length) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setFadeState("out");

      // Wait for fade-out, then advance
      setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
        setFadeState("in");
      }, 400);
    }, STEP_DURATION);

    return () => clearTimeout(timer);
  }, [currentStep, onComplete]);

  if (currentStep >= STEPS.length) return null;

  const step = STEPS[currentStep];

  return (
    <div className="flex min-h-screen flex-col bg-white px-6 py-6">
      {/* Logo header */}
      <div className="flex items-center gap-2">
        <Image src="/logo.png" alt="Zoan" width={28} height={28} priority />
        <span className="text-lg font-semibold text-gray-900">zoan</span>
      </div>

      {/* Centered content */}
      <div className="flex flex-1 items-center justify-center">
        <div
          className={`flex flex-col items-center gap-6 transition-opacity duration-400 ${
            fadeState === "in" ? "opacity-100" : "opacity-0"
          }`}
        >
          <h2 className="whitespace-pre-line text-center text-xl font-semibold text-gray-900">
            {step.title}
          </h2>

          <Image
            src={step.image}
            alt={step.title}
            width={200}
            height={200}
            priority
          />

          {/* Skeleton lines */}
          <div className="flex flex-col items-center gap-2">
            <div className="h-3 w-40 animate-pulse rounded-full bg-gray-200" />
            <div className="h-3 w-32 animate-pulse rounded-full bg-gray-200" />
            <div className="h-3 w-24 animate-pulse rounded-full bg-gray-200" />
          </div>

          <p className="whitespace-pre-line text-center text-xs text-gray-400">
            {step.subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}
