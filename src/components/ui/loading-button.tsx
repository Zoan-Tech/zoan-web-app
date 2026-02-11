import { ReactNode, ButtonHTMLAttributes } from "react";
import { SpinnerGapIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface LoadingButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
  loadingText?: string;
  children: ReactNode;
}

export function LoadingButton({
  isLoading,
  loadingText,
  children,
  className,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-lg bg-[#27CEC5] py-3 font-medium text-white transition-colors hover:bg-[#20b5ad] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <SpinnerGapIcon className="h-5 w-5 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}
