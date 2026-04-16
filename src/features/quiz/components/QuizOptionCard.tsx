'use client';

interface QuizOptionCardProps {
  value: string;
  label: string;
  description: string;
  icon: string;
  isSelected: boolean;
  onSelect: (value: string) => void;
}

export function QuizOptionCard({
  value,
  label,
  description,
  icon,
  isSelected,
  onSelect,
}: QuizOptionCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      onClick={() => onSelect(value)}
      className={[
        'group relative flex w-full items-start gap-4 rounded-xl border-2 p-4 text-left transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        isSelected
          ? 'border-blue-600 bg-blue-50 shadow-sm'
          : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50',
      ].join(' ')}
    >
      {/* Icon */}
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-xl shadow-sm"
        aria-hidden="true"
      >
        {icon}
      </span>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p
          className={[
            'text-sm font-semibold leading-tight',
            isSelected ? 'text-blue-900' : 'text-gray-900',
          ].join(' ')}
        >
          {label}
        </p>
        <p className="mt-0.5 text-xs text-gray-500 leading-snug">{description}</p>
      </div>

      {/* Selected indicator */}
      <span
        className={[
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          isSelected
            ? 'border-blue-600 bg-blue-600'
            : 'border-gray-300 group-hover:border-blue-400',
        ].join(' ')}
        aria-hidden="true"
      >
        {isSelected && (
          <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 12 12">
            <path d="M3.707 5.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L5 6.586 3.707 5.293z" />
          </svg>
        )}
      </span>
    </button>
  );
}
