/**
 * Settings domain types.
 * Covers account settings, security, preferences, notification channels,
 * and privacy/consent — all managed under the /settings/* routes.
 */

// ---------------------------------------------------------------------------
// Account
// ---------------------------------------------------------------------------

/** Payload to request an e-mail address change. */
export interface UpdateEmailPayload {
  newEmail: string;
  /** Current password required for re-authentication before changing e-mail. */
  currentPassword: string;
}

/** Payload to request a phone number change. */
export interface UpdatePhonePayload {
  /** E.164 formatted phone number, e.g. "+447911123456". */
  newPhone: string;
  /** ISO 3166-1 alpha-2 country code for the dialling prefix. */
  countryCode: string;
}

/** Payload for OTP verification after requesting an e-mail or phone change. */
export interface VerifyChangeOtpPayload {
  otp: string;
  /** The pending e-mail or phone being verified. */
  target: string;
}

// ---------------------------------------------------------------------------
// Security
// ---------------------------------------------------------------------------

/** Current 2FA status for the authenticated user. */
export interface TwoFactorStatus {
  enabled: boolean;
  /** TOTP provisioning URI — only present when first enabling 2FA. */
  otpAuthUrl: string | null;
  /** One-time backup codes — only present on initial setup. */
  backupCodes: string[] | null;
  /** ISO 8601 timestamp of last 2FA setup, null if never enabled. */
  enabledAt: string | null;
}

/** Payload to enable 2FA — the user submits the TOTP code to confirm setup. */
export interface EnableTwoFactorPayload {
  /** 6-digit TOTP code from the authenticator app. */
  totpCode: string;
}

/** Payload to disable 2FA — requires re-authentication. */
export interface DisableTwoFactorPayload {
  /** Current password for re-authentication. */
  currentPassword: string;
  /** Optional 2FA code if already enabled. */
  totpCode?: string;
}

/** A single active login session for the authenticated user. */
export interface ActiveSession {
  id: string;
  /** User-agent string of the browser/device. */
  userAgent: string;
  /** Approximate human-readable location derived from IP, e.g. "London, UK". */
  location: string | null;
  /** ISO 8601 timestamp of the last activity on this session. */
  lastActiveAt: string;
  /** ISO 8601 timestamp when this session was created. */
  createdAt: string;
  /** True if this is the session the current request came from. */
  isCurrent: boolean;
}

/** Payload to deactivate the account (soft delete — recoverable). */
export interface DeactivateAccountPayload {
  /** Current password required for confirmation. */
  password: string;
  /** Optional reason for deactivation. */
  reason?: string;
}

// ---------------------------------------------------------------------------
// Preferences
// ---------------------------------------------------------------------------

/** User preferences stored and updated via /settings/preferences. */
export interface UserPreferences {
  /** ISO 4217 preferred send-currency code, e.g. "GBP". */
  preferredSendCurrency: string;
  /** ISO 3166-1 alpha-2 preferred receive-country code, e.g. "NG". */
  preferredReceiveCountry: string;
  /** IETF language tag, e.g. "en-GB". */
  language: string;
  /** ISO 4217 preferred display-currency code (may differ from send currency). */
  displayCurrency: string;
}

/** Payload for PATCH /settings/preferences. All fields optional. */
export type UpdatePreferencesPayload = Partial<UserPreferences>;

// ---------------------------------------------------------------------------
// Notification Preferences
// ---------------------------------------------------------------------------

/** Per-channel notification toggle state for a single event type. */
export interface NotificationChannels {
  email: boolean;
  push: boolean;
  sms: boolean;
}

/**
 * Full notification preferences object.
 * Each key maps to a logical event category with per-channel toggles.
 */
export interface NotificationPreferences {
  /** Rate alert hit notifications. */
  rateAlerts: NotificationChannels;
  /** Transfer status updates (sent, received, failed). */
  transferUpdates: NotificationChannels;
  /** Promotional offers and campaigns. */
  promotions: NotificationChannels;
  /** News and app announcements. */
  news: NotificationChannels;
  /** Account security events (login, password change). */
  accountSecurity: NotificationChannels;
  /** Weekly exchange rate digest. */
  weeklyDigest: NotificationChannels;
}

/** Payload for PATCH /settings/notifications — deep partial. */
export type UpdateNotificationPreferencesPayload = {
  [K in keyof NotificationPreferences]?: Partial<NotificationChannels>;
};

// ---------------------------------------------------------------------------
// Privacy / Consent
// ---------------------------------------------------------------------------

/** Privacy and consent preferences. */
export interface PrivacyPreferences {
  /** Whether the user has opted in to marketing communications. */
  marketingOptIn: boolean;
  /** Whether the user consents to anonymised analytics collection. */
  analyticsConsent: boolean;
  /** Whether the user consents to sharing data with third-party comparison partners. */
  thirdPartySharing: boolean;
  /** ISO 8601 timestamp of last consent update. */
  lastUpdatedAt: string;
}

/** Payload for PATCH /settings/privacy. */
export type UpdatePrivacyPayload = Omit<PrivacyPreferences, 'lastUpdatedAt'>;
