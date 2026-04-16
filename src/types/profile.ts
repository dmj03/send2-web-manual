/**
 * User profile domain types.
 * Extends the core User identity with personal, address, and preference data.
 */

import type { User } from './auth';

/** A postal address record. */
export interface Address {
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  /** ISO 3166-1 alpha-2 country code. */
  country: string;
}

/**
 * Full user profile as returned by GET /profile/.
 * Extends the base User with PII and preference fields.
 */
export interface UserProfile extends User {
  /** E.164 formatted phone number, or null if not set. */
  phoneNumber: string | null;
  address: Address | null;
  /** ISO 4217 preferred send currency code. */
  preferredCurrency: string;
  /** ISO 3166-1 alpha-2 preferred receive country code. */
  preferredCountry: string;
  marketingOptIn: boolean;
  twoFactorEnabled: boolean;
}

/** Payload for the PATCH /profile/ endpoint. Omits immutable fields. */
export interface UpdateProfilePayload {
  name?: string;
  phoneNumber?: string;
  address?: Address;
  preferredCurrency?: string;
  preferredCountry?: string;
  marketingOptIn?: boolean;
}
