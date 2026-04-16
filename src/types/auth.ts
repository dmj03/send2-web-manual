/**
 * Authentication and identity domain types.
 * Covers the logged-in user shape, session contract, and all auth action payloads.
 */

/** All roles a Send2 user can hold. */
export type UserRole = 'user' | 'admin' | 'provider_rep' | 'moderator';

/** Core authenticated user record as returned by the /profile/ endpoint. */
export interface User {
  id: string;
  email: string;
  /** Full display name. */
  name: string;
  /** Absolute URL of the user's avatar image, or null if unset. */
  avatarUrl: string | null;
  roles: UserRole[];
  isVerified: boolean;
  /** ISO 8601 timestamp. */
  createdAt: string;
  /** ISO 8601 timestamp. */
  updatedAt: string;
}

/** Shape of the session object stored by NextAuth v5. */
export interface AuthSession {
  user: User;
  /** JWT access token forwarded to API calls. */
  accessToken: string;
  /** ISO 8601 expiry timestamp. */
  expiresAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
  /** Optional referral code supplied at registration. */
  referralCode?: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  /** Short-lived token from the reset e-mail link. */
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}
