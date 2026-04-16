interface StarRatingProps {
  rating: number;
  /** If true, renders a screen-reader-visible label. */
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASS = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
} as const;

export function StarRating({ rating, showLabel = false, size = 'sm' }: StarRatingProps) {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;
  const sizeClass = SIZE_CLASS[size];

  return (
    <div className="flex items-center gap-0.5">
      {showLabel && (
        <span className="sr-only">{rating.toFixed(1)} out of 5 stars</span>
      )}
      <div className="flex items-center gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => {
          if (i < full) return <FilledStar key={i} className={sizeClass} />;
          if (i === full && hasHalf) return <HalfStar key={i} className={sizeClass} />;
          return <EmptyStar key={i} className={sizeClass} />;
        })}
      </div>
    </div>
  );
}

function FilledStar({ className }: { className: string }) {
  return (
    <svg className={`${className} text-amber-400`} viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function HalfStar({ className }: { className: string }) {
  return (
    <svg className={`${className} text-amber-400`} viewBox="0 0 20 20">
      <defs>
        <linearGradient id="half-gradient">
          <stop offset="50%" stopColor="currentColor" />
          <stop offset="50%" stopColor="#e5e7eb" />
        </linearGradient>
      </defs>
      <path
        fill="url(#half-gradient)"
        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
      />
    </svg>
  );
}

function EmptyStar({ className }: { className: string }) {
  return (
    <svg className={`${className} text-gray-200`} viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}
