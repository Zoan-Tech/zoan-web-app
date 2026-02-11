interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionLabel = "View All", onAction }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="font-bold text-gray-900">{title}</h2>
      {onAction && (
        <button onClick={onAction} className="text-sm text-[#27CEC5]">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
