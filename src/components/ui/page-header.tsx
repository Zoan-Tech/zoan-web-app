import { ReactNode } from "react";

interface PageHeaderProps {
  title?: string;
  children?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, children, actions }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-gray-100 bg-white/80 px-4 backdrop-blur-lg">
      {children || (
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
      )}
      {actions && <div className="ml-auto">{actions}</div>}
    </header>
  );
}
