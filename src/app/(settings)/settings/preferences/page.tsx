import type { Metadata } from 'next';
import { PreferencesForm } from '@/features/settings/components/preferences/PreferencesForm';

export const metadata: Metadata = {
  title: 'Preferences | Send2',
  description: 'Set your default currency, destination country, and display language.',
  robots: { index: false, follow: false },
};

export default function PreferencesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Preferences</h1>
        <p className="mt-1 text-sm text-gray-500">
          Set your default currency, destination country, and display language.
        </p>
      </div>

      <PreferencesForm />
    </div>
  );
}
