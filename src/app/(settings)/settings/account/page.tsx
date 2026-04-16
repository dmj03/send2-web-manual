import type { Metadata } from 'next';
import { EmailChangeForm } from '@/features/settings/components/account/EmailChangeForm';
import { PhoneChangeForm } from '@/features/settings/components/account/PhoneChangeForm';

export const metadata: Metadata = {
  title: 'Account Settings | Send2',
  description: 'Update your email address and phone number.',
  robots: { index: false, follow: false },
};

export default function AccountSettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Account</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update your email address and phone number.
        </p>
      </div>

      <div className="space-y-6">
        <EmailChangeForm />
        <PhoneChangeForm />
      </div>
    </div>
  );
}
