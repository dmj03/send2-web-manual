import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProviderDirectoryClient } from '@/features/provider/components/ProviderDirectoryClient';
import { ProviderGridSkeleton } from '@/features/provider/components/ProviderListSkeletons';
import type { Provider } from '@/types/provider';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Money Transfer Providers',
  description:
    'Compare all major international money transfer providers. Find the best exchange rates, lowest fees, and fastest delivery for your corridor.',
  alternates: {
    canonical: '/providers',
  },
  openGraph: {
    title: 'Money Transfer Providers — Send2',
    description:
      'Browse and compare 50+ money transfer providers. Filter by transfer method, rating, and more.',
    url: '/providers',
  },
};

async function getProviders(): Promise<Provider[]> {
  const baseUrl = process.env['NEXT_PUBLIC_API_BASE_URL'] ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${baseUrl}/providers`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: Provider[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

export default async function ProvidersPage() {
  const providers = await getProviders();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Money Transfer Providers',
    description: 'International money transfer providers listed on Send2',
    numberOfItems: providers.length,
    itemListElement: providers.slice(0, 20).map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'FinancialService',
        name: p.name,
        url: p.website,
        description: p.description,
        aggregateRating: p.reviewCount > 0
          ? {
              '@type': 'AggregateRating',
              ratingValue: p.rating,
              reviewCount: p.reviewCount,
            }
          : undefined,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Page header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Money Transfer Providers
          </h1>
          <p className="mt-2 text-base text-gray-500">
            Compare{' '}
            {providers.length > 0 ? (
              <span className="font-medium text-gray-700">{providers.length}</span>
            ) : (
              'leading'
            )}{' '}
            international transfer providers — rates, fees, speed, and more.
          </p>
        </header>

        {providers.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 py-24 text-center">
            <p className="text-sm font-medium text-gray-600">
              Provider directory is temporarily unavailable.
            </p>
            <p className="mt-1 text-xs text-gray-400">Please check back shortly.</p>
          </div>
        ) : (
          <Suspense fallback={<ProviderGridSkeleton count={9} />}>
            <ProviderDirectoryClient providers={providers} />
          </Suspense>
        )}
      </div>
    </>
  );
}
