"use client";

import Image from "next/image";

export function ExploreBanner() {
  return (
    <div className="px-4 pt-3">
      <div className="relative h-50 overflow-hidden rounded-2xl bg-gradient-to-br from-[#27CEC5] via-[#4ECDC4] to-[#45B7D1]">
        <Image
          src="/images/zoan-bg-thumb.png"
          alt="Zoan illustration"
          fill
          className="object-cover"
        />
      </div>
    </div>
  );
}
