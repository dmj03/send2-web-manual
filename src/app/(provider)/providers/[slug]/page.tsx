import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import type { Provider } from '@/types/provider';
import { ProviderDetailHero } from '@/features/provider/components/ProviderDetailHero';
import { ProviderFeeTable } from '@/features/provider/components/ProviderFeeTable';
import { ProviderSpeedInfo } from '@/features/provider/components/ProviderSpeedInfo';
import { ProviderCorridors } from '@/features/provider/components/ProviderCorridors';
import { ProviderReviews } from '@/features/provider/components/ProviderReviews';

export const revalidate = 300;

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getProviderBySlug(slug: string): Promise<Provider | null> {
  const baseUrl = process.env['NEXT_PUBLIC_API_BASE_URL'] ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${baseUrl}/providers/slug/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const json = (await res.json()) as { data: Provider };
    return json.data ?? null;
  } catch {
    return null;
  }
}

async function getAllProviderSlugs(): Promise<string[]> {
  const baseUrl = process.env['NEXT_PUBLIC_API_BASE_URL'] ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${baseUrl}/providers`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data: Provider[] };
    return (json.data ?? []).map((p) => p.slug);
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Static params
// ---------------------------------------------------------------------------

export async function generateStaticParams() {
  const slugs = await getAllProviderSlugs();
  return slugs.map((slug) => ({ slug }));
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const provider = await getProviderBySlug(slug);

  if (!provider) {
    return {
      title: 'Provider Not Found',
    };
  }

  const title = `${provider.name} Review — Fees, Rates & Speed`;
  const description =
    provider.description ||
    `Compare ${provider.name} exchange rates, fees, and transfer speeds. Read ${provider.reviewCount.toLocaleString()} verified reviews on Send2.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/providers/${provider.slug}`,
    },
    openGraph: {
      title: `${title} | Send2`,
      description,
      url: `/providers/${provider.slug}`,
      images: provider.logoUrl
        ? [{ url: provider.logoUrl, alt: `${provider.name} logo` }]
        : undefined,
    },
  };
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
  id?: string;
}

function SectionCard({ title, children, id }: SectionCardProps) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-heading` : undefined}
      className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
    >
      <h2
        id={id ? `${id}-heading` : undefined}
        className="mb-4 text-base font-semibold text-gray-900"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function ProviderDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const provider = await getProviderBySlug(slug);

  if (!provider) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FinancialService',
    name: provider.name,
    description: provider.description,
    url: provider.website,
    logo: provider.logoUrl || undefined,
    aggregateRating:
      provider.reviewCount > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: provider.rating,
            reviewCount: provider.reviewCount,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
    serviceType: 'Money Transfer',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <ProviderDetailHero provider={provider} />

      {/* Body */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main column */}
          <div className="space-y-8 lg:col-span-2">
            {/* Fees */}
            <SectionCard title="Fees & rates" id="fees">
              <ProviderFeeTable fees={provider.fees} />
            </SectionCard>

            {/* Corridors */}
            {provider.supportedCorridors.length > 0 && (
              <SectionCard title="Supported corridors" id="corridors">
                <ProviderCorridors corridors={provider.supportedCorridors.slice(0, 30)} />
              </SectionCard>
            )}

            {/* Reviews */}
            <section
              id="reviews"
              aria-labelledby="reviews-heading"
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <h2
                id="reviews-heading"
                className="mb-4 text-base font-semibold text-gray-900"
              >
                Customer reviews
                {provider.reviewCount > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-400">
                    ({provider.reviewCount.toLocaleString()})
                  </span>
                )}
              </h2>
              <Suspense
                fallback={
                  <div className="space-y-6" aria-busy="true">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="animate-pulse border-b border-gray-50 pb-6">
                        <div className="flex gap-3">
                          <div className="h-9 w-9 rounded-full bg-gray-100" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 w-32 rounded bg-gray-100" />
                            <div className="h-3 w-full rounded bg-gray-100" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                }
              >
                <ProviderReviews providerId={provider.id} providerName={provider.name} />
              </Suspense>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Speed */}
            <SectionCard title="Transfer speed" id="speed">
              <ProviderSpeedInfo speedEstimates={provider.speedEstimates} />
            </SectionCard>

            {/* Transfer methods */}
            {provider.transferMethods.length > 0 && (
              <SectionCard title="Transfer methods">
                <ul className="space-y-2">
                  {provider.transferMethods.map((method) => (
                    <li
                      key={method}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <svg
                        className="h-4 w-4 flex-shrink-0 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {
                        {
                          bank_transfer: 'Bank transfer',
                          mobile_money: 'Mobile money',
                          cash_pickup: 'Cash pickup',
                          wallet: 'Wallet',
                          debit_card: 'Debit card',
                          credit_card: 'Credit card',
                        }[method] ?? method
                      }
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}

            {/* Quick facts */}
            <div className="rounded-2xl border border-blue-50 bg-blue-50/50 p-5">
              <h3 className="mb-3 text-sm font-semibold text-blue-900">Quick facts</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Rating</dt>
                  <dd className="font-medium text-gray-900">
                    {provider.rating.toFixed(1)} / 5.0
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Reviews</dt>
                  <dd className="font-medium text-gray-900">
                    {provider.reviewCount.toLocaleString()}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Corridors</dt>
                  <dd className="font-medium text-gray-900">
                    {provider.supportedCorridors.length}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-gray-500">Verified</dt>
                  <dd className="font-medium text-gray-900">
                    {provider.isVerified ? 'Yes' : 'No'}
                  </dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
