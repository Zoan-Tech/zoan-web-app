import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 py-12",
        className
      )}
    >
      <p className="text-lg font-medium text-gray-900">{title}</p>
      {description && <p className="text-gray-500">{description}</p>}
      {action}
    </div>
  );
}
