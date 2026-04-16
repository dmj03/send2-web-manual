import type { AppNotification, NotificationType } from '@/types/notification';

export const mockNotification: AppNotification = {
  id: 'notif_01',
  userId: 'usr_01HXYZ123456ABCDEF',
  type: 'rate_alert_triggered' as NotificationType,
  title: 'Rate alert triggered',
  body: 'GBP → NGN has reached your target rate of 1,700. Act now!',
  isRead: false,
  actionUrl: null,
  createdAt: '2025-04-14T08:32:00.000Z',
};

export const mockNotifications: AppNotification[] = [
  mockNotification,
  {
    id: 'notif_02',
    userId: 'usr_01HXYZ123456ABCDEF',
    type: 'transfer_complete' as NotificationType,
    title: 'Transfer completed',
    body: 'Your transfer of £500 via Wise to Nigeria has been delivered.',
    isRead: false,
    actionUrl: null,
    createdAt: '2025-04-13T15:00:00.000Z',
  },
  {
    id: 'notif_03',
    userId: 'usr_01HXYZ123456ABCDEF',
    type: 'promotion' as NotificationType,
    title: 'Zero fees this weekend with Remitly',
    body: 'Send money to Nigeria with zero fees until Sunday midnight.',
    isRead: true,
    actionUrl: null,
    createdAt: '2025-04-11T10:00:00.000Z',
  },
  {
    id: 'notif_04',
    userId: 'usr_01HXYZ123456ABCDEF',
    type: 'system' as NotificationType,
    title: 'Verify your email address',
    body: 'Please verify your email address to unlock all Send2 features.',
    isRead: true,
    actionUrl: null,
    createdAt: '2025-04-10T16:46:00.000Z',
  },
  {
    id: 'notif_05',
    userId: 'usr_01HXYZ123456ABCDEF',
    type: 'rate_alert_triggered' as NotificationType,
    title: 'Rate alert: GBP → USD',
    body: 'GBP → USD is now 1.29, approaching your target of 1.32.',
    isRead: true,
    actionUrl: null,
    createdAt: '2025-04-09T07:15:00.000Z',
  },
];
