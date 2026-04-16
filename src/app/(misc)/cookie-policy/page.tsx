import type { Metadata } from 'next';
import { LegalPageContent } from '@/features/misc/components';

export const revalidate = false;

export const metadata: Metadata = {
  title: 'Cookie Policy | Send2',
  description:
    'Understand how Send2 uses cookies and similar technologies, and how to manage your preferences.',
  alternates: { canonical: '/cookie-policy' },
  robots: { index: true, follow: true },
};

const COOKIE_TYPES = [
  {
    name: 'Strictly Necessary',
    purpose: 'Required for the site to function. Cannot be disabled.',
    examples: 'Session ID, CSRF token, auth_token',
    duration: 'Session / 30 days',
    canOptOut: false,
  },
  {
    name: 'Analytics',
    purpose: 'Help us understand how visitors interact with the site.',
    examples: 'Page views, session duration, bounce rate',
    duration: 'Up to 2 years',
    canOptOut: true,
  },
  {
    name: 'Functional',
    purpose: 'Remember your preferences to personalise your experience.',
    examples: 'Currency preference, amount preference, dark mode',
    duration: 'Up to 1 year',
    canOptOut: true,
  },
  {
    name: 'Marketing',
    purpose: 'Track visits across sites to deliver relevant advertising.',
    examples: 'Ad impression, click tracking, retargeting pixels',
    duration: 'Up to 90 days',
    canOptOut: true,
  },
];

const SECTIONS = [
  {
    id: 'what-are-cookies',
    title: 'What Are Cookies?',
    content: (
      <p>
        Cookies are small text files stored on your device by your browser when you visit a website.
        They are widely used to make websites work, or work more efficiently, as well as to provide
        information to site owners. Similar technologies — such as local storage, session storage,
        and pixel tags — serve the same purposes and are governed by this same policy.
      </p>
    ),
  },
  {
    id: 'cookies-we-use',
    title: 'Cookies We Use',
    content: (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left">
              <th className="pb-2 pr-4 font-medium text-gray-800">Type</th>
              <th className="pb-2 pr-4 font-medium text-gray-800">Purpose</th>
              <th className="pb-2 pr-4 font-medium text-gray-800">Examples</th>
              <th className="pb-2 pr-4 font-medium text-gray-800">Duration</th>
              <th className="pb-2 font-medium text-gray-800">Optional?</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {COOKIE_TYPES.map((row) => (
              <tr key={row.name}>
                <td className="py-2.5 pr-4 font-medium text-gray-800">{row.name}</td>
                <td className="py-2.5 pr-4 text-gray-600">{row.purpose}</td>
                <td className="py-2.5 pr-4 text-gray-500">{row.examples}</td>
                <td className="py-2.5 pr-4 text-gray-600">{row.duration}</td>
                <td className="py-2.5">
                  {row.canOptOut ? (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                      Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                      No
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  },
  {
    id: 'third-party-cookies',
    title: 'Third-Party Cookies',
    content: (
      <>
        <p>
          Some cookies are set by third-party services we use for analytics and advertising. These
          third parties have their own privacy and cookie policies:
        </p>
        <ul className="mt-3 list-disc pl-5 space-y-1">
          <li>
            <strong>Google Analytics</strong> — aggregated traffic analysis. Governed by Google&apos;s
            Privacy Policy.
          </li>
          <li>
            <strong>Hotjar</strong> — heatmaps and session recordings (anonymised). Governed by
            Hotjar&apos;s Privacy Policy.
          </li>
          <li>
            <strong>Google Ads</strong> — remarketing (only if you consented to marketing cookies).
            Governed by Google&apos;s Privacy Policy.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'managing-cookies',
    title: 'Managing Your Cookie Preferences',
    content: (
      <>
        <p>
          You can manage your cookie preferences in several ways:
        </p>
        <ul className="mt-3 list-disc pl-5 space-y-2">
          <li>
            <strong>Cookie banner:</strong> when you first visit the site, our cookie consent banner
            lets you accept or reject optional categories. You can revisit your choices at any time
            via the &ldquo;Cookie settings&rdquo; link in our footer.
          </li>
          <li>
            <strong>Browser settings:</strong> all major browsers let you block or delete cookies.
            Note that disabling strictly necessary cookies will break core functionality.
          </li>
          <li>
            <strong>Opt-out tools:</strong> for Google Analytics, visit{' '}
            <span className="font-medium">tools.google.com/dlpage/gaoptout</span>. For
            interest-based advertising, visit <span className="font-medium">youronlinechoices.eu</span>.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'consent',
    title: 'Your Consent',
    content: (
      <p>
        By clicking &ldquo;Accept all cookies&rdquo; on our cookie banner, you consent to the
        placement of non-essential cookies. You may withdraw consent at any time by adjusting your
        preferences. Withdrawing consent does not affect the lawfulness of processing based on
        consent before its withdrawal.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to This Policy',
    content: (
      <p>
        We may update this Cookie Policy to reflect changes in the cookies we use or for other
        operational, legal, or regulatory reasons. Please revisit this page regularly to stay
        informed. The &ldquo;Last updated&rdquo; date at the top indicates when this page was last
        revised.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact',
    content: (
      <p>
        Questions about cookies or our use of tracking technologies? Email us at{' '}
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
];

export default function CookiePolicyPage() {
  return (
    <LegalPageContent
      title="Cookie Policy"
      lastUpdated="1 March 2025"
      effectiveDate="1 March 2025"
      intro="This policy explains what cookies and similar technologies we use, why we use them, and how you can control them."
      sections={SECTIONS}
    />
  );
}
