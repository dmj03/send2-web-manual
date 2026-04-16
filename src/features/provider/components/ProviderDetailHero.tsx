import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import type { Provider } from '@/types/provider';
import { ROUTES, buildSearchUrl } from '@/lib/navigation';
import { StarRating } from './StarRating';
import { CompareButton } from './CompareButton';

interface ProviderDetailHeroProps {
  provider: Provider;
}

export function ProviderDetailHero({ provider }: ProviderDetailHeroProps) {
  const sendUrl = buildSearchUrl({ fromCurrency: 'GBP' });

  return (
    <div className="border-b border-gray-100 bg-white pb-8 pt-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-1.5 text-sm text-gray-400">
            <li>
              <Link href={ROUTES.home as Route} className="hover:text-gray-600">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={ROUTES.providers.list as Route} className="hover:text-gray-600">
                Providers
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-gray-700" aria-current="page">
              {provider.name}
            </li>
          </ol>
        </nav>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          {/* Logo + info */}
          <div className="flex items-start gap-5">
            {/* Logo */}
            <div className="relative h-16 w-32 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-white p-1 shadow-sm">
              {provider.logoUrl ? (
                <Image
                  src={provider.logoUrl}
                  alt={`${provider.name} logo`}
                  fill
                  sizes="128px"
                  className="object-contain p-1"
                  priority
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-blue-700">
                  {provider.name.charAt(0)}
                </span>
              )}
            </div>

            {/* Details */}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  {provider.name}
                </h1>
                {provider.isVerified && (
                  <span className="flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 ring-1 ring-green-200">
                    <svg
                      className="h-3.5 w-3.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Verified
                  </span>
                )}
                {provider.isFeatured && (
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
                    Featured
                  </span>
                )}
              </div>

              {/* Rating */}
              <div className="mt-2 flex items-center gap-2">
                <StarRating rating={provider.rating} showLabel size="md" />
                <span className="text-sm font-medium text-gray-700">
                  {provider.rating.toFixed(1)}
                </span>
                <a
                  href="#reviews"
                  className="text-sm text-gray-400 hover:text-gray-600 hover:underline"
                >
                  {provider.reviewCount.toLocaleString()} reviews
                </a>
              </div>

              {/* Description */}
              {provider.description && (
                <p className="mt-2 max-w-xl text-sm text-gray-600">{provider.description}</p>
              )}

              {/* Tags */}
              {provider.tags.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Provider attributes">
                  {provider.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <Link
              href={sendUrl as Route}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Compare rates
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <CompareButton providerId={provider.id} providerName={provider.name} />
            {provider.website && (
              <a
                href={provider.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-400 hover:text-gray-600 hover:underline"
              >
                Visit website ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
