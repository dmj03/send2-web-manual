import Link from 'next/link';
import type { Route } from 'next';
import { ROUTES } from '@/lib/navigation';
import type { Promotion } from '@/types/content';

async function getActivePromotions(): Promise<Promotion[]> {
  const baseUrl = process.env['NEXT_PUBLIC_API_BASE_URL'] ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${baseUrl}/content/promotions`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: Promotion[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

export async function PromoBanners() {
  const promotions = await getActivePromotions();

  if (promotions.length === 0) return null;

  return (
    <div>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Current offers
      </h2>
      <ul className="flex gap-4 overflow-x-auto pb-2" aria-label="Current promotions">
        {promotions.slice(0, 4).map((promo) => (
          <li key={promo.id} className="min-w-[260px] flex-shrink-0 sm:min-w-0 sm:flex-1">
            <Link
              href={ROUTES.providers.list as Route}
              className="group block rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={`${promo.title} — ${promo.description}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-semibold leading-tight">{promo.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-blue-100">{promo.description}</p>
                </div>
                <DiscountBadge type={promo.discountType} value={promo.discountValue} />
              </div>
              {promo.promoCode && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-2.5 py-1 text-xs font-mono font-semibold tracking-wider">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {promo.promoCode}
                </div>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface DiscountBadgeProps {
  type: Promotion['discountType'];
  value: number;
}

function DiscountBadge({ type, value }: DiscountBadgeProps) {
  let label: string;

  switch (type) {
    case 'percentage':
      label = `${value}% off`;
      break;
    case 'fixed':
      label = `£${value} off`;
      break;
    case 'fee_waived':
      label = 'No fee';
      break;
    case 'rate_boost':
      label = `+${value}% rate`;
      break;
    default:
      label = 'Offer';
  }

  return (
    <span className="shrink-0 rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-bold text-yellow-900">
      {label}
    </span>
  );
}
