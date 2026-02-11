import { cn } from "@/lib/utils";

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
} as const;

interface VerifiedBadgeProps {
  size?: keyof typeof sizeMap;
  className?: string;
}

export function VerifiedBadge({ size = "sm", className }: VerifiedBadgeProps) {
  return (
    <span className={cn("text-[#27CEC5]", className)}>
      <svg className={sizeMap[size]} viewBox="0 0 24 24" fill="currentColor">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </span>
  );
}
