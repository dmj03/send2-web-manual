import type { Metadata } from 'next';
import { NotificationPreferencesForm } from '@/features/settings/components/notifications/NotificationPreferencesForm';

export const metadata: Metadata = {
  title: 'Notification Settings | Send2',
  description: 'Choose how and when you receive rate alerts, transfer updates, and promotions.',
  robots: { index: false, follow: false },
};

export default function NotificationSettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="mt-1 text-sm text-gray-500">
          Choose how and when you receive rate alerts, transfer updates, and promotions.
        </p>
      </div>

      <NotificationPreferencesForm />
    </div>
  );
}
