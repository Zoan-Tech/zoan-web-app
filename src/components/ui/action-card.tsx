import { ReactNode } from "react";

interface ActionCardProps {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function ActionCard({ icon, label, onClick, disabled }: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center gap-2 rounded-xl bg-white p-4 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E0FAF8]">
        {icon}
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </button>
  );
}
