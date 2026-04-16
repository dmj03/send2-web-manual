'use client';

import Link from 'next/link';
import { useCompareStore } from '@/stores/compareStore';
import { ROUTES } from '@/lib/navigation';

export function CompareBasketDrawer() {
  const basket = useCompareStore((s) => s.basket);
  const clearBasket = useCompareStore((s) => s.clearBasket);
  const removeFromBasket = useCompareStore((s) => s.removeFromBasket);

  if (basket.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Compare basket"
      className="fixed bottom-4 left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-4"
    >
      <div className="rounded-2xl border border-blue-200 bg-white p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900">
            {basket.length} / 3 providers selected
          </span>
          <button
            type="button"
            onClick={clearBasket}
            className="text-xs text-gray-400 underline hover:text-gray-600 focus:outline-none"
            aria-label="Clear compare basket"
          >
            Clear
          </button>
        </div>

        {/* IDs list (visual placeholder — real names resolved at compare page) */}
        <div className="mt-2 flex gap-2">
          {basket.map((id) => (
            <span
              key={id}
              className="flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
            >
              #{id.slice(0, 6)}
              <button
                type="button"
                onClick={() => removeFromBasket(id)}
                aria-label={`Remove provider ${id} from compare`}
                className="ml-0.5 text-blue-400 hover:text-blue-700 focus:outline-none"
              >
                ×
              </button>
            </span>
          ))}
          {Array.from({ length: 3 - basket.length }).map((_, i) => (
            <span
              key={`empty-${i}`}
              className="rounded-lg border border-dashed border-gray-300 px-3 py-1 text-xs text-gray-300"
            >
              Add
            </span>
          ))}
        </div>

        <Link
          href={ROUTES.compare}
          className="mt-3 flex w-full items-center justify-center rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Compare now →
        </Link>
      </div>
    </div>
  );
}
