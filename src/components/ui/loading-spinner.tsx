import { SpinnerGapIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-8 w-8",
} as const;

interface LoadingSpinnerProps {
  size?: keyof typeof sizeMap;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingSpinner({
  size = "lg",
  fullScreen = false,
  className,
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        fullScreen ? "min-h-screen" : "py-12",
        className
      )}
    >
      <SpinnerGapIcon
        className={cn(sizeMap[size], "animate-spin text-[#27CEC5]")}
      />
    </div>
  );
}
