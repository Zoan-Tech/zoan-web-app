import { ReactNode } from "react";

interface PageHeaderProps {
  title?: string;
  children?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, children, actions }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center px-4 backdrop-blur-lg">
      {children ? (
        <div className="flex w-full justify-center">{children}</div>
      ) : (
        <>
          <span className="mx-auto text-sm font-medium text-gray-900">{title}</span>
          {actions && <div className="ml-auto">{actions}</div>}
        </>
      )}
    </header>
  );
}
