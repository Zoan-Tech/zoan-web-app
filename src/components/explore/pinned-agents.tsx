"use client";

import Image from "next/image";
import { ComponentType } from "react";
import {
  ButterflyIcon,
  SealIcon,
  StarOfDavidIcon,
} from "@phosphor-icons/react";
import type { IconProps } from "@phosphor-icons/react";

interface PinnedItem {
  label: string;
  icon?: ComponentType<IconProps>;
  image?: string;
  color: string;
}

const PINNED_ICONS: PinnedItem[] = [
  { label: "Agents", image: "/logo-draw-filled.svg", color: "#27CEC5" },
  { label: "Search", icon: ButterflyIcon, color: "#FF6B6B" },
  { label: "Social", icon: SealIcon, color: "#4ECDC4" },
  { label: "Activities", icon: StarOfDavidIcon, color: "#FFA07A" },
];

export function PinnedAgents() {
  return (
    <div className="px-4 pb-2 pt-4">
      <h2 className="mb-3 text-sm font-semibold text-gray-900">Pinned</h2>
      <div className="flex justify-center gap-15">
        {PINNED_ICONS.map((item) => (
          <button
            key={item.label}
            className="flex flex-col items-center gap-1.5"
          >
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ backgroundColor: `${item.color}15` }}
            >
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.label}
                  width={24}
                  height={24}
                />
              ) : item.icon ? (
                <item.icon
                  size={24}
                  weight="fill"
                  style={{ color: item.color }}
                />
              ) : null}
            </div>
            <span className="text-[11px] text-gray-600">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
