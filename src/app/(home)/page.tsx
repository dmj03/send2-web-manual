import { Suspense } from 'react';
import type { Metadata } from 'next';
import { HeroSearchForm } from '@/features/home/components/HeroSearchForm';
import { FeaturedProviders } from '@/features/home/components/FeaturedProviders';
import { PromoBanners } from '@/features/home/components/PromoBanners';
import { HowItWorks } from '@/features/home/components/HowItWorks';
import { LatestArticles } from '@/features/home/components/LatestArticles';
import {
  FeaturedProvidersSkeleton,
  PromoBannersSkeleton,
  LatestArticlesSkeleton,
} from '@/features/home/components/HomeSkeletons';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Send2 — Compare Money Transfer Services',
  description:
    'Find the best exchange rates and lowest fees for international money transfers. Compare 50+ providers instantly.',
  alternates: {
    canonical: '/',
  },
};

export default function HomePage() {
  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Send2',
            description:
              'Compare international money transfer services — rates, fees, and speed.',
            url: process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://send2.com',
            potentialAction: {
              '@type': 'SearchAction',
              target: {
                '@type': 'EntryPoint',
                urlTemplate: `${process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://send2.com'}/search?fromCurrency={fromCurrency}&toCurrency={toCurrency}&amount={amount}`,
              },
              'query-input': [
                'required name=fromCurrency',
                'required name=toCurrency',
                'optional name=amount',
              ],
            },
          }),
        }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 pb-16 pt-12 text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Send money abroad —<br />
              <span className="text-blue-200">for less</span>
            </h1>
            <p className="mt-4 text-lg text-blue-100 sm:text-xl">
              Compare 50+ money transfer providers. Find the best rate in seconds.
            </p>
          </div>

          <div className="mt-10">
            <HeroSearchForm />
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section
        className="border-b border-gray-100 bg-white py-5"
        aria-label="Trust indicators"
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-gray-500">
            <li className="flex items-center gap-2">
              <CheckIcon className="h-4 w-4 shrink-0 text-green-500" aria-hidden="true" />
              Free comparison — no sign-up required
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon className="h-4 w-4 shrink-0 text-green-500" aria-hidden="true" />
              50+ regulated providers
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon className="h-4 w-4 shrink-0 text-green-500" aria-hidden="true" />
              Live exchange rates
            </li>
            <li className="flex items-center gap-2">
              <CheckIcon className="h-4 w-4 shrink-0 text-green-500" aria-hidden="true" />
              Trusted by 2 million+ users
            </li>
          </ul>
        </div>
      </section>

      {/* Promo banners */}
      <section className="bg-gray-50 py-8" aria-label="Current promotions">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Suspense fallback={<PromoBannersSkeleton />}>
            <PromoBanners />
          </Suspense>
        </div>
      </section>

      {/* Featured providers */}
      <section className="bg-white py-14" aria-labelledby="featured-heading">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2
                id="featured-heading"
                className="text-2xl font-bold text-gray-900 sm:text-3xl"
              >
                Top-rated providers
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Verified, highly-rated services used by thousands every day
              </p>
            </div>
          </div>
          <Suspense fallback={<FeaturedProvidersSkeleton />}>
            <FeaturedProviders />
          </Suspense>
        </div>
      </section>

      {/* How it works */}
      <HowItWorks />

      {/* Latest articles */}
      <section className="bg-gray-50 py-14" aria-labelledby="articles-heading">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2
              id="articles-heading"
              className="text-2xl font-bold text-gray-900 sm:text-3xl"
            >
              Latest news &amp; guides
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Stay informed with expert money transfer tips and currency news
            </p>
          </div>
          <Suspense fallback={<LatestArticlesSkeleton />}>
            <LatestArticles />
          </Suspense>
        </div>
      </section>
    </>
  );
}

function CheckIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      {...props}
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  );
}
