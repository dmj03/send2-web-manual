import type { Metadata } from 'next';
import { LegalPageContent } from '@/features/misc/components';

export const revalidate = false; // static — never stale

export const metadata: Metadata = {
  title: 'Terms of Service | Send2',
  description:
    'Read the Send2 Terms of Service — the rules that govern your use of our free money transfer comparison platform.',
  alternates: { canonical: '/terms' },
  robots: { index: true, follow: true },
};

const SECTIONS = [
  {
    id: 'acceptance',
    title: 'Acceptance of Terms',
    content: (
      <p>
        By accessing or using Send2 (&ldquo;the Service&rdquo;), you agree to be bound by these
        Terms of Service (&ldquo;Terms&rdquo;). If you do not agree to all of these Terms, do not
        use the Service. We may revise these Terms at any time by updating this page; continued use
        after changes constitutes acceptance.
      </p>
    ),
  },
  {
    id: 'service-description',
    title: 'Description of Service',
    content: (
      <>
        <p>
          Send2 is an independent price comparison service. We aggregate and display publicly
          available rate and fee information from regulated money transfer providers to help you
          make informed decisions. We do not process, hold, or transmit funds on your behalf.
        </p>
        <p className="mt-3">
          All actual transfers are made directly between you and your chosen provider under that
          provider&apos;s own terms and conditions. Send2 is not a party to any transfer transaction.
        </p>
      </>
    ),
  },
  {
    id: 'eligibility',
    title: 'Eligibility',
    content: (
      <p>
        You must be at least 18 years old and capable of entering into a legally binding contract to
        use the Service. By using the Service, you represent and warrant that you meet these
        requirements. The Service is not available to users in jurisdictions where its use would be
        prohibited by applicable law.
      </p>
    ),
  },
  {
    id: 'user-accounts',
    title: 'User Accounts',
    content: (
      <>
        <p>
          Certain features (such as rate alerts and search history) require you to create an
          account. You are responsible for maintaining the confidentiality of your credentials and
          for all activity under your account.
        </p>
        <ul className="mt-3 list-disc pl-5 space-y-1">
          <li>Provide accurate and complete registration information.</li>
          <li>Notify us immediately of any unauthorised access to your account.</li>
          <li>
            Not share your password or allow others to access your account on your behalf.
          </li>
        </ul>
        <p className="mt-3">
          We reserve the right to suspend or terminate accounts that violate these Terms or that we
          reasonably believe have been compromised.
        </p>
      </>
    ),
  },
  {
    id: 'acceptable-use',
    title: 'Acceptable Use',
    content: (
      <>
        <p>You agree not to:</p>
        <ul className="mt-3 list-disc pl-5 space-y-1">
          <li>Scrape, crawl, or systematically extract data from the Service.</li>
          <li>
            Use the Service for any unlawful purpose or in violation of any local, national, or
            international law.
          </li>
          <li>
            Attempt to gain unauthorised access to any part of the Service or its infrastructure.
          </li>
          <li>
            Transmit any unsolicited advertising, spam, or other commercial messages through the
            Service.
          </li>
          <li>
            Impersonate any person or entity or misrepresent your affiliation with any person or
            entity.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'intellectual-property',
    title: 'Intellectual Property',
    content: (
      <p>
        All content on the Service — including text, graphics, logos, icons, and software — is the
        property of Send2 or its content suppliers and is protected by applicable intellectual
        property laws. You may not reproduce, distribute, or create derivative works without our
        express written permission, except as permitted by applicable law for personal,
        non-commercial use.
      </p>
    ),
  },
  {
    id: 'accuracy',
    title: 'Data Accuracy and Disclaimer',
    content: (
      <>
        <p>
          We strive to display accurate, up-to-date exchange rates and fees. However, rates change
          constantly and the information on the Service may not reflect the rate you actually receive
          when completing a transfer with a provider.
        </p>
        <p className="mt-3">
          The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without
          warranties of any kind, express or implied, including but not limited to warranties of
          accuracy, fitness for a particular purpose, or non-infringement.
        </p>
      </>
    ),
  },
  {
    id: 'limitation-of-liability',
    title: 'Limitation of Liability',
    content: (
      <p>
        To the fullest extent permitted by law, Send2 shall not be liable for any indirect,
        incidental, special, consequential, or punitive damages arising from your use of, or
        inability to use, the Service or from any transfer decision made on the basis of information
        from the Service. Our total aggregate liability for any claim relating to the Service shall
        not exceed £100.
      </p>
    ),
  },
  {
    id: 'third-party-links',
    title: 'Third-Party Links',
    content: (
      <p>
        The Service contains links to third-party websites and provider portals. These links are
        provided for convenience only. We have no control over and assume no responsibility for the
        content, privacy policies, or practices of any third-party sites. We encourage you to review
        the terms and privacy policies of any provider before initiating a transfer.
      </p>
    ),
  },
  {
    id: 'governing-law',
    title: 'Governing Law',
    content: (
      <p>
        These Terms are governed by and construed in accordance with the laws of England and Wales.
        Any dispute arising under these Terms shall be subject to the exclusive jurisdiction of the
        courts of England and Wales, unless mandatory consumer protection laws in your jurisdiction
        provide otherwise.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact',
    content: (
      <p>
        Questions about these Terms should be sent to{' '}
        <a
          href="mailto:legal@send2.com"
          className="text-blue-600 hover:text-blue-700 hover:underline"
        >
          legal@send2.com
        </a>
        .
      </p>
    ),
  },
];

export default function TermsPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Terms of Service — Send2',
    url: 'https://send2.com/terms',
    description: 'Send2 Terms of Service governing use of the platform.',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LegalPageContent
        title="Terms of Service"
        lastUpdated="1 March 2025"
        effectiveDate="1 March 2025"
        intro="Please read these Terms carefully before using Send2. They explain what you can expect from us and what we expect from you."
        sections={SECTIONS}
      />
    </>
  );
}
