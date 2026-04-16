/**
 * In-app notification domain types.
 * Covers the notification centre feed and individual notification records.
 */

/** All notification event categories the app can produce. */
export type NotificationType =
  | 'rate_alert_triggered'
  | 'transfer_complete'
  | 'transfer_failed'
  | 'kyc_approved'
  | 'kyc_rejected'
  | 'promotion'
  | 'system'
  | 'news';

/** A single notification item shown in the notification centre. */
export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  /** Deep-link URL to navigate to when the notification is tapped, or null. */
  actionUrl: string | null;
  /** ISO 8601 timestamp. */
  createdAt: string;
}
