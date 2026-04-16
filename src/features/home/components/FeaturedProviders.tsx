import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { ROUTES } from '@/lib/navigation';
import type { Provider } from '@/types/provider';

// Server-side data fetch with ISR — the page already sets revalidate = 60,
// so this runs at most once per minute.
async function getFeaturedProviders(): Promise<Provider[]> {
  const baseUrl = process.env['NEXT_PUBLIC_API_BASE_URL'] ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${baseUrl}/providers/featured`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: Provider[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

export async function FeaturedProviders() {
  const providers = await getFeaturedProviders();

  if (providers.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        Provider data is temporarily unavailable. Please check back soon.
      </p>
    );
  }

  return (
    <ul
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-label="Featured money transfer providers"
    >
      {providers.slice(0, 6).map((provider) => (
        <li key={provider.id}>
          <Link
            href={ROUTES.providers.detail(provider.slug) as Route}
            className="group flex h-full flex-col rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label={`View ${provider.name} details`}
          >
            {/* Logo + verified badge */}
            <div className="flex items-start justify-between">
              <div className="relative h-10 w-24">
                {provider.logoUrl ? (
                  <Image
                    src={provider.logoUrl}
                    alt={`${provider.name} logo`}
                    fill
                    sizes="96px"
                    className="object-contain object-left"
                  />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                    {provider.name.charAt(0)}
                  </span>
                )}
              </div>
              {provider.isVerified && (
                <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-200">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Verified
                </span>
              )}
            </div>

            {/* Name + description */}
            <div className="mt-3 flex-1">
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">
                {provider.name}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                {provider.description}
              </p>
            </div>

            {/* Rating */}
            <div className="mt-4 flex items-center gap-2">
              <StarRating rating={provider.rating} />
              <span className="text-xs text-gray-400">
                {provider.rating.toFixed(1)} ({provider.reviewCount.toLocaleString()} reviews)
              </span>
            </div>

            {/* Transfer methods */}
            {provider.transferMethods.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-1" aria-label="Transfer methods">
                {provider.transferMethods.slice(0, 3).map((method) => (
                  <li
                    key={method}
                    className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                  >
                    {formatTransferMethod(method)}
                  </li>
                ))}
                {provider.transferMethods.length > 3 && (
                  <li className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                    +{provider.transferMethods.length - 3} more
                  </li>
                )}
              </ul>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const partial = rating - full;

  return (
    <div className="flex items-center gap-0.5" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => {
        if (i < full) {
          return <FilledStar key={i} />;
        }
        if (i === full && partial >= 0.5) {
          return <HalfStar key={i} />;
        }
        return <EmptyStar key={i} />;
      })}
    </div>
  );
}

function FilledStar() {
  return (
    <svg className="h-3.5 w-3.5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function HalfStar() {
  return (
    <svg className="h-3.5 w-3.5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" clipPath="url(#half)" />
    </svg>
  );
}

function EmptyStar() {
  return (
    <svg className="h-3.5 w-3.5 text-gray-200" viewBox="0 0 20 20" fill="currentColor">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function formatTransferMethod(method: string): string {
  const labels: Record<string, string> = {
    bank_transfer: 'Bank',
    mobile_money: 'Mobile',
    cash_pickup: 'Cash',
    wallet: 'Wallet',
    debit_card: 'Debit',
    credit_card: 'Credit',
  };
  return labels[method] ?? method;
}
