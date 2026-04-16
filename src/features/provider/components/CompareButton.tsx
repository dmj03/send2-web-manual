'use client';

import { useCompareStore } from '@/stores/compareStore';

interface CompareButtonProps {
  providerId: string;
  providerName: string;
}

export function CompareButton({ providerId, providerName }: CompareButtonProps) {
  const basket = useCompareStore((s) => s.basket);
  const addToBasket = useCompareStore((s) => s.addToBasket);
  const removeFromBasket = useCompareStore((s) => s.removeFromBasket);
  const isInBasket = basket.includes(providerId);
  const isBasketFull = basket.length >= 3 && !isInBasket;

  function handleToggle() {
    if (isInBasket) {
      removeFromBasket(providerId);
    } else {
      addToBasket(providerId);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isBasketFull}
      aria-pressed={isInBasket}
      aria-label={
        isInBasket
          ? `Remove ${providerName} from comparison`
          : `Add ${providerName} to comparison`
      }
      className={[
        'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
        isInBasket
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : isBasketFull
            ? 'cursor-not-allowed bg-gray-100 text-gray-400'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
      ].join(' ')}
    >
      <svg
        className="h-3.5 w-3.5 flex-shrink-0"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        {isInBasket ? (
          <path
            fillRule="evenodd"
            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
            clipRule="evenodd"
          />
        ) : (
          <path
            fillRule="evenodd"
            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
            clipRule="evenodd"
          />
        )}
      </svg>
      {isInBasket ? 'Comparing' : isBasketFull ? 'Compare full' : 'Compare'}
    </button>
  );
}
