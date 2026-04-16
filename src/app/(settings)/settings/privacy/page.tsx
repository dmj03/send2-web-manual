import type { Metadata } from 'next';
import { PrivacyConsentForm } from '@/features/settings/components/privacy/PrivacyConsentForm';

export const metadata: Metadata = {
  title: 'Privacy & Consent | Send2',
  description: 'Control your data, marketing preferences, and consent settings.',
  robots: { index: false, follow: false },
};

export default function PrivacySettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Privacy &amp; Consent</h1>
        <p className="mt-1 text-sm text-gray-500">
          Control your data, marketing preferences, and consent settings.
        </p>
      </div>

      <PrivacyConsentForm />
    </div>
  );
}
