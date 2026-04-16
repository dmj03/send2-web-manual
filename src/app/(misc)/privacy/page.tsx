import type { Metadata } from 'next';
import { LegalPageContent } from '@/features/misc/components';

export const revalidate = false;

export const metadata: Metadata = {
  title: 'Privacy Policy | Send2',
  description:
    'Learn how Send2 collects, uses, and protects your personal data in compliance with UK GDPR and the Data Protection Act 2018.',
  alternates: { canonical: '/privacy' },
  robots: { index: true, follow: true },
};

const SECTIONS = [
  {
    id: 'overview',
    title: 'Who We Are',
    content: (
      <p>
        Send2 Ltd (&ldquo;Send2&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is
        the data controller for personal data collected through{' '}
        <span className="font-medium">send2.com</span>. We are registered in England and Wales.
        You can reach our data protection team at{' '}
        <a
          href="mailto:privacy@send2.com"
          className="text-blue-600 hover:text-blue-700 hover:underline"
        >
          privacy@send2.com
        </a>
        .
      </p>
    ),
  },
  {
    id: 'data-collected',
    title: 'Data We Collect',
    content: (
      <>
        <p>We collect the following categories of personal data:</p>
        <ul className="mt-3 list-disc pl-5 space-y-2">
          <li>
            <strong>Account data:</strong> name, email address, password hash, and optional profile
            photo when you create an account.
          </li>
          <li>
            <strong>Search data:</strong> the currencies, corridors, and amounts you search for, and
            the timestamps of those searches.
          </li>
          <li>
            <strong>Rate alert data:</strong> the target rate, corridor, and contact preference you
            configure for rate alerts.
          </li>
          <li>
            <strong>Device and usage data:</strong> IP address, browser type, operating system,
            referring URLs, pages visited, and session duration collected via server logs and
            analytics cookies.
          </li>
          <li>
            <strong>Communications data:</strong> the content of messages you send us via the
            contact form or email.
          </li>
        </ul>
        <p className="mt-3">
          We do not collect payment card details, bank account numbers, or passport/identity
          document data.
        </p>
      </>
    ),
  },
  {
    id: 'legal-basis',
    title: 'Legal Basis for Processing',
    content: (
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left">
            <th className="pb-2 pr-4 font-medium text-gray-800">Purpose</th>
            <th className="pb-2 font-medium text-gray-800">Legal basis</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {[
            ['Providing the comparison service', 'Legitimate interests'],
            ['Account creation and management', 'Contract performance'],
            ['Sending rate alert notifications', 'Contract performance'],
            ['Analytics and service improvement', 'Legitimate interests'],
            ['Marketing emails (opt-in only)', 'Consent'],
            ['Legal compliance and fraud prevention', 'Legal obligation'],
          ].map(([purpose, basis]) => (
            <tr key={purpose}>
              <td className="py-2 pr-4 text-gray-600">{purpose}</td>
              <td className="py-2 text-gray-600">{basis}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ),
  },
  {
    id: 'data-sharing',
    title: 'Who We Share Data With',
    content: (
      <>
        <p>We do not sell your personal data. We may share data with:</p>
        <ul className="mt-3 list-disc pl-5 space-y-1">
          <li>
            <strong>Cloud infrastructure providers</strong> (servers, databases, CDN) — governed by
            data processing agreements.
          </li>
          <li>
            <strong>Analytics providers</strong> — aggregated, anonymised where possible.
          </li>
          <li>
            <strong>Email service providers</strong> — to deliver transactional and alert emails.
          </li>
          <li>
            <strong>Law enforcement or regulators</strong> — when required by law or to protect
            rights and safety.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'data-retention',
    title: 'How Long We Keep Your Data',
    content: (
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>Account data:</strong> held for the duration of your account plus 2 years after
          closure.
        </li>
        <li>
          <strong>Search history:</strong> 12 months from the date of each search.
        </li>
        <li>
          <strong>Rate alerts:</strong> deleted 30 days after the alert is cancelled or triggered.
        </li>
        <li>
          <strong>Communications:</strong> 3 years from the date of the last message.
        </li>
        <li>
          <strong>Analytics data:</strong> aggregated and anonymised after 26 months.
        </li>
      </ul>
    ),
  },
  {
    id: 'your-rights',
    title: 'Your Rights',
    content: (
      <>
        <p>Under UK GDPR you have the right to:</p>
        <ul className="mt-3 list-disc pl-5 space-y-1">
          <li>
            <strong>Access</strong> a copy of your personal data.
          </li>
          <li>
            <strong>Rectification</strong> of inaccurate data.
          </li>
          <li>
            <strong>Erasure</strong> (&ldquo;right to be forgotten&rdquo;) in certain circumstances.
          </li>
          <li>
            <strong>Restriction</strong> of processing while a dispute is resolved.
          </li>
          <li>
            <strong>Portability</strong> — receive your data in a machine-readable format.
          </li>
          <li>
            <strong>Object</strong> to processing based on legitimate interests.
          </li>
          <li>
            <strong>Withdraw consent</strong> at any time (where processing is based on consent).
          </li>
        </ul>
        <p className="mt-3">
          To exercise any of these rights, email{' '}
          <a
            href="mailto:privacy@send2.com"
            className="text-blue-600 hover:text-blue-700 hover:underline"
          >
            privacy@send2.com
          </a>
          . We will respond within 30 days. You also have the right to lodge a complaint with the
          Information Commissioner&apos;s Office (ICO) at{' '}
          <span className="font-medium">ico.org.uk</span>.
        </p>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies',
    content: (
      <p>
        We use cookies and similar technologies. For full details of what we set and why, please
        see our{' '}
        <a
          href="/cookie-policy"
          className="text-blue-600 hover:text-blue-700 hover:underline"
        >
          Cookie Policy
        </a>
        . You can manage your preferences at any time via your browser settings or our cookie
        banner.
      </p>
    ),
  },
  {
    id: 'security',
    title: 'Security',
    content: (
      <p>
        We implement appropriate technical and organisational measures to protect your personal data
        against accidental loss, unauthorised access, disclosure, or destruction. These include
        encryption at rest and in transit, access controls, and regular security testing. No method
        of transmission over the internet is 100% secure; we cannot guarantee absolute security.
      </p>
    ),
  },
  {
    id: 'international-transfers',
    title: 'International Transfers',
    content: (
      <p>
        Some of our service providers are located outside the UK. Where we transfer personal data
        internationally, we rely on UK adequacy decisions or Standard Contractual Clauses approved
        by the ICO to ensure an equivalent level of data protection.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to This Policy',
    content: (
      <p>
        We may update this Privacy Policy from time to time. The &ldquo;Last updated&rdquo; date at
        the top of this page shows when the most recent revision was made. Material changes will be
        notified by email to registered users at least 14 days before they take effect.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Privacy Policy — Send2',
    url: 'https://send2.com/privacy',
    description: 'Send2 Privacy Policy — how we collect, use, and protect your personal data.',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LegalPageContent
        title="Privacy Policy"
        lastUpdated="1 March 2025"
        effectiveDate="1 March 2025"
        intro="This policy explains how Send2 collects and uses your personal data, your rights, and how to contact us with questions or requests."
        sections={SECTIONS}
      />
    </>
  );
}
