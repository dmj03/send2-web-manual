import type { Metadata } from 'next';
import { ContactForm } from '@/features/content/components/ContactForm';

export const metadata: Metadata = {
  title: 'Contact Us | Send2',
  description:
    'Get in touch with the Send2 team for support, media enquiries, or partnership opportunities.',
  alternates: { canonical: '/contact-us' },
  robots: { index: true, follow: true },
};

const CONTACT_CHANNELS = [
  {
    label: 'Support',
    value: 'support@send2.com',
    description: 'Account and transfer help',
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
        />
      </svg>
    ),
  },
  {
    label: 'Press & Media',
    value: 'press@send2.com',
    description: 'Journalists and content creators',
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z"
        />
      </svg>
    ),
  },
  {
    label: 'Partnerships',
    value: 'partners@send2.com',
    description: 'Provider listings and integrations',
    icon: (
      <svg
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z"
        />
      </svg>
    ),
  },
];

export default function ContactUsPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact Send2',
    url: 'https://send2.com/contact-us',
    description: 'Get in touch with the Send2 team.',
    contactPoint: [
      {
        '@type': 'ContactPoint',
        email: 'support@send2.com',
        contactType: 'customer support',
        availableLanguage: 'English',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Page header */}
        <header className="mb-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Get in touch
          </h1>
          <p className="mt-3 text-base text-gray-500">
            We typically reply within 1–2 business days.
          </p>
        </header>

        <div className="grid gap-12 lg:grid-cols-5">
          {/* Contact channels */}
          <aside className="lg:col-span-2">
            <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-gray-400">
              Reach us directly
            </h2>

            <ul className="space-y-4">
              {CONTACT_CHANNELS.map((channel) => (
                <li key={channel.label}>
                  <a
                    href={`mailto:${channel.value}`}
                    className="group flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  >
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                      {channel.icon}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {channel.label}
                      </p>
                      <p className="text-xs text-gray-400">
                        {channel.description}
                      </p>
                      <p className="mt-1 text-sm text-blue-600">
                        {channel.value}
                      </p>
                    </div>
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-xl border border-gray-100 bg-gray-50 p-5">
              <p className="text-sm font-medium text-gray-700">Response time</p>
              <p className="mt-1 text-xs text-gray-500">
                Support: <strong>within 24h</strong> on weekdays
                <br />
                Press: <strong>within 48h</strong>
                <br />
                Partnerships: <strong>within 5 business days</strong>
              </p>
            </div>
          </aside>

          {/* Contact form */}
          <section
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-3 lg:p-8"
            aria-labelledby="contact-form-heading"
          >
            <h2
              id="contact-form-heading"
              className="mb-6 text-lg font-semibold text-gray-900"
            >
              Send us a message
            </h2>
            <ContactForm />
          </section>
        </div>
      </div>
    </>
  );
}
