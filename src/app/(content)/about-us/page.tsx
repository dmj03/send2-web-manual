import type { Metadata } from 'next';
import Link from 'next/link';
import { ROUTES } from '@/lib/navigation';

export const metadata: Metadata = {
  title: 'About Us | Send2',
  description:
    'Send2 helps millions of people find the cheapest and fastest way to send money abroad. Learn about our mission, team, and values.',
  alternates: { canonical: '/about-us' },
  openGraph: {
    title: 'About Send2',
    description:
      'We exist to make international money transfers transparent, affordable, and accessible to everyone.',
    url: '/about-us',
  },
};

const STATS = [
  { label: 'Providers compared', value: '50+' },
  { label: 'Corridors supported', value: '200+' },
  { label: 'Monthly searches', value: '2M+' },
  { label: 'Average saving per transfer', value: '£18' },
];

const VALUES = [
  {
    title: 'Transparency',
    description:
      'We show you the real total cost — exchange rate margin, fees, and delivery time — with no hidden charges.',
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  {
    title: 'Independence',
    description:
      'We are not owned by any money transfer provider. Our rankings are based on objective data, not sponsorships.',
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
        />
      </svg>
    ),
  },
  {
    title: 'Accessibility',
    description:
      "Whether you're sending \u00a350 or \u00a350,000, our free comparison tool works for everyone across all corridors.",
    icon: (
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
        />
      </svg>
    ),
  },
];

export default function AboutUsPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Send2',
    url: 'https://send2.com',
    description:
      'Send2 is an independent money transfer comparison service helping people find the best exchange rates and lowest fees worldwide.',
    foundingDate: '2020',
    logo: 'https://send2.com/logo.png',
    sameAs: ['https://twitter.com/send2money'],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="bg-white">
        {/* Hero */}
        <section className="bg-gradient-to-b from-blue-50 to-white py-20 text-center">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
              We make global money transfers{' '}
              <span className="text-blue-600">fair and transparent</span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-gray-500">
              Send2 is an independent comparison service. We analyse fees,
              exchange rates, and delivery speeds across 50+ providers so you
              always know exactly what you&apos;re paying — before you send.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href={ROUTES.search}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                Compare providers
              </Link>
              <Link
                href={ROUTES.blog.index}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                Read our guides
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-gray-100 bg-white py-12" aria-label="Key statistics">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <dl className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <dd className="text-3xl font-extrabold text-blue-600">
                    {stat.value}
                  </dd>
                  <dt className="mt-1 text-sm text-gray-500">{stat.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Mission */}
        <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Our mission
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500">
            Remittance fees cost migrant workers{' '}
            <strong className="text-gray-700">$50 billion</strong> every year —
            money that should reach families, not intermediaries. Send2 exists to
            arm senders with real data so they can make an informed choice and
            keep more of what they earn.
          </p>
        </section>

        {/* Values */}
        <section
          className="bg-gray-50 py-16"
          aria-labelledby="values-heading"
        >
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2
              id="values-heading"
              className="mb-10 text-center text-2xl font-bold text-gray-900 sm:text-3xl"
            >
              What we stand for
            </h2>
            <div className="grid gap-8 sm:grid-cols-3">
              {VALUES.map((value) => (
                <div
                  key={value.title}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    {value.icon}
                  </div>
                  <h3 className="mb-2 font-semibold text-gray-900">
                    {value.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-500">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-blue-600 py-16 text-center">
          <div className="mx-auto max-w-xl px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Ready to save on your next transfer?
            </h2>
            <p className="mt-3 text-blue-100">
              Compare all the top providers in under 30 seconds — free, with no
              registration required.
            </p>
            <Link
              href={ROUTES.search}
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-blue-700 shadow-sm transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600"
            >
              Compare now
            </Link>
          </div>
        </section>

        {/* Contact nudge */}
        <section className="py-10 text-center">
          <p className="text-sm text-gray-500">
            Questions or media enquiries?{' '}
            <Link
              href={ROUTES.contactUs}
              className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Contact us
            </Link>
            .
          </p>
        </section>
      </div>
    </>
  );
}
