/**
 * Rate alert domain types.
 * Users can set target exchange rates and be notified when a provider hits them.
 */

/** All channels through which a rate alert notification can be delivered. */
export type NotificationChannel = 'email' | 'push' | 'sms' | 'in_app';

/** A persisted rate alert record belonging to a user. */
export interface RateAlert {
  id: string;
  userId: string;
  /** ISO 4217 source currency code. */
  fromCurrency: string;
  /** ISO 4217 target currency code. */
  toCurrency: string;
  /** The exchange rate the user wants to be notified at. */
  targetRate: number;
  /** Most recently fetched exchange rate for this pair. */
  currentRate: number;
  isActive: boolean;
  notifyVia: NotificationChannel[];
  /** ISO 8601 timestamp of when the alert was last triggered, null if never. */
  triggeredAt: string | null;
  /** ISO 8601 timestamp. */
  createdAt: string;
}

/** Payload for the POST /rate-alerts endpoint. */
export interface CreateRateAlertPayload {
  fromCurrency: string;
  toCurrency: string;
  targetRate: number;
  notifyVia: NotificationChannel[];
}
