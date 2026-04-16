import Link from 'next/link';
import { ROUTES } from '@/lib/navigation';
import type { Route } from 'next';

interface Step {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  {
    number: '01',
    title: 'Enter your details',
    description:
      "Tell us how much you want to send, the currency you\u2019re sending from, and where it needs to go.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zM16.862 4.487L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Compare providers',
    description:
      'We instantly show you live rates and fees from 50+ regulated money transfer services, ranked by total cost.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Transfer with confidence',
    description:
      'Click through to your chosen provider and send money knowing you got the best deal — all providers are fully regulated.',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
];

export function HowItWorks() {
  return (
    <section
      className="bg-gradient-to-b from-gray-50 to-white py-16"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2
            id="how-it-works-heading"
            className="text-2xl font-bold text-gray-900 sm:text-3xl"
          >
            How Send2 works
          </h2>
          <p className="mt-2 text-gray-500">
            Comparing money transfer providers takes less than 30 seconds.
          </p>
        </div>

        <ol
          className="mt-12 grid gap-8 sm:grid-cols-3"
          aria-label="Steps to compare money transfers"
        >
          {STEPS.map((step) => (
            <li
              key={step.number}
              className="relative flex flex-col items-center text-center"
            >
              {/* Step number circle */}
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg"
                aria-hidden="true"
              >
                {step.icon}
              </div>

              {/* Number badge */}
              <span
                className="absolute -top-2 -right-2 hidden h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 sm:flex"
                aria-hidden="true"
              >
                {step.number}
              </span>

              <h3 className="mt-5 font-semibold text-gray-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                {step.description}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-12 text-center">
          <Link
            href={ROUTES.search as Route}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Start comparing now
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
