import type { Metadata } from 'next';
import { TwoFactorToggle } from '@/features/settings/components/security/TwoFactorToggle';
import { ActiveSessionsList } from '@/features/settings/components/security/ActiveSessionsList';
import { DangerZone } from '@/features/settings/components/security/DangerZone';

export const metadata: Metadata = {
  title: 'Security Settings | Send2',
  description: 'Manage two-factor authentication, active sessions, and account security.',
  robots: { index: false, follow: false },
};

export default function SecuritySettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Security</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage two-factor authentication, active sessions, and account security.
        </p>
      </div>

      <div className="space-y-6">
        <TwoFactorToggle />
        <ActiveSessionsList />
        <DangerZone />
      </div>
    </div>
  );
}
