import { ReactNode } from "react";

interface PageContentProps {
  children: ReactNode;
  className?: string;
}

export function PageContent({ children, className = "" }: PageContentProps) {
  return (
    <div
      className={`flex-1 overflow-x-hidden overflow-y-auto rounded-t-3xl border border-b-0 border-[#E1F1F0] bg-white shadow-[0_0_12px_0_rgba(0,0,0,0.04)] ${className}`}
    >
      {children}
    </div>
  );
}
