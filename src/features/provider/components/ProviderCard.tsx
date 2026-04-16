import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import { ROUTES } from '@/lib/navigation';
import type { Provider } from '@/types/provider';
import { StarRating } from './StarRating';
import { CompareButton } from './CompareButton';

const TRANSFER_METHOD_LABELS: Record<string, string> = {
  bank_transfer: 'Bank',
  mobile_money: 'Mobile',
  cash_pickup: 'Cash',
  wallet: 'Wallet',
  debit_card: 'Debit',
  credit_card: 'Credit',
};

interface ProviderCardProps {
  provider: Provider;
}

export function ProviderCard({ provider }: ProviderCardProps) {
  return (
    <article className="group relative flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md">
      {/* Featured ribbon */}
      {provider.isFeatured && (
        <span className="absolute -top-px right-4 rounded-b-lg bg-blue-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
          Featured
        </span>
      )}

      <div className="flex flex-1 flex-col p-5">
        {/* Header row: logo + badges */}
        <div className="flex items-start justify-between gap-3">
          {/* Logo */}
          <div className="relative h-10 w-28 flex-shrink-0">
            {provider.logoUrl ? (
              <Image
                src={provider.logoUrl}
                alt={`${provider.name} logo`}
                fill
                sizes="112px"
                className="object-contain object-left"
              />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                {provider.name.charAt(0)}
              </span>
            )}
          </div>

          {/* Verified badge */}
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
          <h2 className="text-base font-semibold text-gray-900 group-hover:text-blue-700">
            <Link
              href={ROUTES.providers.detail(provider.slug) as Route}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <span className="absolute inset-0" aria-hidden="true" />
              {provider.name}
            </Link>
          </h2>
          {provider.description && (
            <p className="mt-1 line-clamp-2 text-sm text-gray-500">{provider.description}</p>
          )}
        </div>

        {/* Rating */}
        <div className="mt-4 flex items-center gap-2">
          <StarRating rating={provider.rating} showLabel size="sm" />
          <span className="text-xs text-gray-500">
            {provider.rating.toFixed(1)}
            <span className="text-gray-400">
              {' '}
              ({provider.reviewCount.toLocaleString()} reviews)
            </span>
          </span>
        </div>

        {/* Transfer methods */}
        {provider.transferMethods.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Transfer methods">
            {provider.transferMethods.slice(0, 4).map((method) => (
              <li
                key={method}
                className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
              >
                {TRANSFER_METHOD_LABELS[method] ?? method}
              </li>
            ))}
            {provider.transferMethods.length > 4 && (
              <li className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400">
                +{provider.transferMethods.length - 4}
              </li>
            )}
          </ul>
        )}

        {/* Tags */}
        {provider.tags.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1" aria-label="Provider tags">
            {provider.tags.slice(0, 3).map((tag) => (
              <li
                key={tag}
                className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}

        {/* Footer: compare button */}
        <div className="relative mt-4 flex items-center justify-between border-t border-gray-50 pt-4">
          <CompareButton providerId={provider.id} providerName={provider.name} />
          <Link
            href={ROUTES.providers.detail(provider.slug) as Route}
            className="relative z-10 text-xs font-medium text-blue-600 hover:underline"
            tabIndex={-1}
            aria-hidden="true"
          >
            View details →
          </Link>
        </div>
      </div>
    </article>
  );
}
