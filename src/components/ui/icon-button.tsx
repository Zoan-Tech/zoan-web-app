import { ButtonHTMLAttributes, forwardRef } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "accent";
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = "default", className, children, ...props }, ref) => {
    const base = "rounded-full p-2 transition-colors";
    const variants = {
      default: "text-gray-500 hover:bg-gray-100 hover:text-gray-900",
      accent: "text-[#27CEC5] hover:bg-[#E0FAF8]",
    };

    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${className || ""}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";
