import type { Metadata } from 'next';
import Link from 'next/link';
import { FaqClient } from '@/features/misc/components';
import type { FaqItem } from '@/features/misc/components';
import { ROUTES } from '@/lib/navigation';

// The rate-alerts page lives at /rate-alerts (not /profile/rate-alerts).
const RATE_ALERTS_PATH = '/rate-alerts' as const;

export const revalidate = 3600; // ISR — refresh hourly

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | Send2',
  description:
    'Answers to the most common questions about using Send2 — how we compare providers, rate alerts, accounts, fees, and more.',
  alternates: { canonical: '/faq' },
  openGraph: {
    title: 'Send2 FAQ',
    description: 'Quick answers to your questions about comparing money transfers with Send2.',
    url: '/faq',
  },
};

const CATEGORIES = [
  { id: 'transfers', label: 'Transfers' },
  { id: 'rates-fees', label: 'Rates & Fees' },
  { id: 'account', label: 'Account' },
  { id: 'security', label: 'Security' },
  { id: 'alerts', label: 'Rate Alerts' },
];

const FAQ_ITEMS: FaqItem[] = [
  // Transfers
  {
    id: 'how-compare-works',
    category: 'transfers',
    question: 'How does Send2 compare money transfer providers?',
    answer: (
      <p>
        We pull live exchange rates, transfer fees, and delivery times from over 50 regulated
        providers and display them side by side. You enter the amount you want to send, your source
        and destination currencies, and we instantly rank the results by total cost — so you see
        exactly how much will arrive at the other end.
      </p>
    ),
  },
  {
    id: 'send2-vs-bank',
    category: 'transfers',
    question: 'Is it cheaper to use a specialist provider than my bank?',
    answer: (
      <p>
        Almost always yes. Banks typically charge a spread of 3–5% on the exchange rate plus a flat
        fee, whereas specialist providers often offer spreads below 1%. On a £1,000 transfer, that
        difference can amount to £20–£40 more arriving at the destination.
      </p>
    ),
  },
  {
    id: 'which-is-fastest',
    category: 'transfers',
    question: 'How do I find the fastest transfer?',
    answer: (
      <p>
        On the search results page you can sort by &ldquo;Delivery time&rdquo; instead of
        &ldquo;Best rate&rdquo;. We display the estimated delivery window (e.g. &ldquo;Same
        day&rdquo; or &ldquo;1–2 business days&rdquo;) for each provider. Same-day options are
        highlighted with a badge.
      </p>
    ),
  },
  {
    id: 'does-send2-send-money',
    category: 'transfers',
    question: 'Does Send2 actually send the money?',
    answer: (
      <p>
        No. Send2 is a comparison tool only. When you click &ldquo;Send with [Provider]&rdquo; you
        are taken directly to that provider&apos;s regulated platform to complete your transfer.
        Send2 is not a payment service provider and never holds or processes your funds.
      </p>
    ),
  },
  // Rates & Fees
  {
    id: 'how-accurate-rates',
    category: 'rates-fees',
    question: 'How accurate are the rates you show?',
    answer: (
      <p>
        We refresh rates frequently throughout the day. However, exchange rates move in real time,
        so the rate you see on Send2 may differ slightly from the rate you receive when you actually
        complete a transfer — especially during periods of high market volatility. Always confirm the
        final rate on the provider&apos;s platform before proceeding.
      </p>
    ),
  },
  {
    id: 'hidden-fees',
    category: 'rates-fees',
    question: 'Are there any hidden fees in the results?',
    answer: (
      <p>
        We aim to show the all-in cost, including the provider&apos;s margin on the exchange rate
        and any transfer fees. However, some providers add a small fee for certain payment methods
        (e.g. credit card vs. bank transfer). We display these where available, but we recommend
        confirming total costs on the provider&apos;s site before booking.
      </p>
    ),
  },
  {
    id: 'is-send2-free',
    category: 'rates-fees',
    question: 'Is Send2 free to use?',
    answer: (
      <p>
        Yes, entirely. Send2 is free for all users. We earn revenue through referral fees paid by
        providers when users click through to their platforms. This does not influence our rankings —
        results are sorted purely by the best rate for the user.
      </p>
    ),
  },
  // Account
  {
    id: 'do-i-need-account',
    category: 'account',
    question: 'Do I need an account to compare rates?',
    answer: (
      <p>
        No account is required to search and compare. You only need to register if you want to save
        search history, set up rate alerts, or manage notification preferences.
      </p>
    ),
  },
  {
    id: 'delete-account',
    category: 'account',
    question: 'How do I delete my account?',
    answer: (
      <p>
        Go to <strong>Settings → Account → Delete account</strong>. Deletion permanently removes
        your profile, saved searches, and rate alerts. It cannot be undone. If you have active rate
        alerts, they will be cancelled immediately upon deletion.
      </p>
    ),
  },
  {
    id: 'change-email',
    category: 'account',
    question: 'Can I change the email address on my account?',
    answer: (
      <p>
        Yes. Go to <strong>Settings → Account</strong> and update your email address. You will
        receive a verification link at the new address; it must be confirmed before the change takes
        effect.
      </p>
    ),
  },
  // Security
  {
    id: 'is-data-safe',
    category: 'security',
    question: 'Is my personal data safe with Send2?',
    answer: (
      <p>
        We apply industry-standard security measures: HTTPS everywhere, encrypted data at rest, and
        strict access controls. We do not store payment card numbers or bank account details — only
        the minimal profile data needed to provide the service. Full details are in our{' '}
        <a href="/privacy" className="text-blue-600 hover:underline">
          Privacy Policy
        </a>
        .
      </p>
    ),
  },
  {
    id: 'two-factor',
    category: 'security',
    question: 'Does Send2 support two-factor authentication?',
    answer: (
      <p>
        Yes. You can enable OTP-based two-factor authentication from{' '}
        <strong>Settings → Security</strong>. Once enabled, you will be asked for a one-time
        passcode sent to your registered email on each new login.
      </p>
    ),
  },
  {
    id: 'forgot-password',
    category: 'security',
    question: 'I forgot my password. How do I reset it?',
    answer: (
      <p>
        On the login page, click <strong>Forgot password?</strong>. Enter your registered email
        address and we will send a reset link valid for 30 minutes. If you do not receive it, check
        your spam folder or{' '}
        <a href="/contact-us" className="text-blue-600 hover:underline">
          contact us
        </a>
        .
      </p>
    ),
  },
  // Rate Alerts
  {
    id: 'what-are-alerts',
    category: 'alerts',
    question: 'What are rate alerts?',
    answer: (
      <p>
        Rate alerts notify you by email when the exchange rate for a corridor you care about reaches
        your target level. For example, you can set an alert for GBP/PHP at 73.00 and we will email
        you the moment any provider hits that rate or better.
      </p>
    ),
  },
  {
    id: 'how-many-alerts',
    category: 'alerts',
    question: 'How many rate alerts can I set?',
    answer: (
      <p>
        Free accounts can have up to 5 active rate alerts at a time. You can delete an existing
        alert from the{' '}
        <Link href={RATE_ALERTS_PATH} className="text-blue-600 hover:underline">
          Rate Alerts
        </Link>{' '}
        page to free up a slot.
      </p>
    ),
  },
  {
    id: 'alert-not-received',
    category: 'alerts',
    question: "I set a rate alert but haven't received anything. What's wrong?",
    answer: (
      <>
        <p>A few things to check:</p>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>Make sure the target rate is realistic and achievable.</li>
          <li>Check your spam or promotions folder.</li>
          <li>
            Confirm your email address is verified under{' '}
            <strong>Settings → Account</strong>.
          </li>
          <li>
            Ensure notification emails are enabled under{' '}
            <strong>Settings → Notifications</strong>.
          </li>
        </ul>
      </>
    ),
  },
];

export default function FaqPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: typeof item.answer === 'string' ? item.answer : item.question,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="bg-white">
        {/* Header */}
        <div className="border-b border-gray-100 bg-gradient-to-b from-blue-50 to-white py-16 text-center">
          <div className="mx-auto max-w-2xl px-4 sm:px-6">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Frequently Asked Questions
            </h1>
            <p className="mt-3 text-base text-gray-500">
              Quick answers about comparing money transfers, your account, and how Send2 works.
            </p>
          </div>
        </div>

        {/* FAQ content */}
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
          <FaqClient items={FAQ_ITEMS} categories={CATEGORIES} />
        </div>

        {/* Still have questions */}
        <div className="border-t border-gray-100 bg-gray-50 py-12">
          <div className="mx-auto max-w-xl px-4 text-center sm:px-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Still have a question?
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Our support team typically replies within one business day.
            </p>
            <Link
              href={ROUTES.contactUs}
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              Contact us
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
