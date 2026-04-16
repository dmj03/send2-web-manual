import type { Metadata } from 'next';
import { NotificationList } from '@/features/notification/components';

export const metadata: Metadata = {
  title: 'Notifications | Send2',
  description: 'Stay up to date with your rate alerts, transfer updates, and announcements.',
  robots: { index: false, follow: false },
};

export default function NotificationsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="mt-1 text-sm text-gray-500">
          Stay up to date with your alerts, transfers, and announcements.
        </p>
      </div>

      <NotificationList />
    </div>
  );
}
