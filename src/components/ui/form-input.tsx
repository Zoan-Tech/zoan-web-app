import { InputHTMLAttributes, forwardRef } from "react";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`w-full rounded-lg border border-gray-200 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-[#27CEC5] focus:outline-none focus:ring-2 focus:ring-[#27CEC5]/20 ${label ? "mt-1" : ""} ${className || ""}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";
