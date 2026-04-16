/**
 * Auth cookie helpers for Send2.
 *
 * Server-side helpers use `next/headers` (async) — call from Server Components
 * or Route Handlers only.
 *
 * Client-side helpers use `document.cookie` — call from Client Components only.
 *
 * The auth_token cookie is httpOnly and is therefore NOT accessible via
 * `document.cookie` from the browser.  Presence/absence is checked via a
 * non-httpOnly sentinel cookie `profile_complete` on the client.
 *
 * Token management (set / delete) MUST go through a Route Handler or Server
 * Action so the httpOnly flag is preserved.
 */

// ─── Cookie names ─────────────────────────────────────────────────────────────

export const AUTH_TOKEN_COOKIE = 'auth_token' as const;
export const PROFILE_COMPLETE_COOKIE = 'profile_complete' as const;

// ─── Server-side helpers ──────────────────────────────────────────────────────
// These must only be imported in Server Components / Route Handlers.

/**
 * Read the auth_token from the request's cookie store (server-side).
 * Returns `null` when the cookie is absent or empty.
 */
export async function getAuthToken(): Promise<string | null> {
  // Dynamic import keeps this module importable in client bundles without
  // pulling in the `next/headers` server-only module at the call site.
  const { cookies } = await import('next/headers');
  const store = await cookies();
  return store.get(AUTH_TOKEN_COOKIE)?.value ?? null;
}

/**
 * Check whether the current request has a valid auth_token cookie.
 * Does NOT validate the token — use only for presence checks.
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken();
  return Boolean(token);
}

/**
 * Check whether the profile-complete sentinel cookie is set (server-side).
 */
export async function isProfileComplete(): Promise<boolean> {
  const { cookies } = await import('next/headers');
  const store = await cookies();
  return store.get(PROFILE_COMPLETE_COOKIE)?.value === 'true';
}

// ─── Route Handler / Server Action helpers ────────────────────────────────────

/**
 * Cookie options used when setting the auth_token.
 * Exported so Route Handlers and Server Actions can reuse the same settings.
 */
export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  // 30-day expiry — adjust to match backend token lifetime.
  maxAge: 60 * 60 * 24 * 30,
} as const;

/**
 * Build a Set-Cookie header value for the auth_token.
 * Use this in Route Handlers when setting the cookie manually.
 */
export function buildAuthCookieHeader(token: string): string {
  const parts = [
    `${AUTH_TOKEN_COOKIE}=${encodeURIComponent(token)}`,
    `Max-Age=${AUTH_COOKIE_OPTIONS.maxAge}`,
    `Path=${AUTH_COOKIE_OPTIONS.path}`,
    `SameSite=${AUTH_COOKIE_OPTIONS.sameSite}`,
  ];
  if (AUTH_COOKIE_OPTIONS.httpOnly) parts.push('HttpOnly');
  if (AUTH_COOKIE_OPTIONS.secure) parts.push('Secure');
  return parts.join('; ');
}

/**
 * Build a Set-Cookie header value that clears the auth_token.
 */
export function buildClearAuthCookieHeader(): string {
  return [
    `${AUTH_TOKEN_COOKIE}=`,
    'Max-Age=0',
    `Path=${AUTH_COOKIE_OPTIONS.path}`,
    `SameSite=${AUTH_COOKIE_OPTIONS.sameSite}`,
    'HttpOnly',
  ].join('; ');
}

// ─── Client-side helpers ──────────────────────────────────────────────────────
// These are safe to import in Client Components. They do NOT touch auth_token
// (httpOnly cookies are invisible to JavaScript).

/**
 * Read a non-httpOnly cookie by name from `document.cookie`.
 * Returns `null` when the cookie is absent.
 *
 * @clientOnly
 */
export function getClientCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1] ?? '') : null;
}

/**
 * Delete a non-httpOnly cookie from `document.cookie`.
 * Does NOT affect httpOnly cookies such as auth_token.
 *
 * @clientOnly
 */
export function clearClientCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
}

/**
 * Check whether the profile-complete sentinel cookie is set (client-side).
 * Mirrors the server-side `isProfileComplete()` for use in Client Components.
 *
 * @clientOnly
 */
export function isProfileCompleteClient(): boolean {
  return getClientCookie(PROFILE_COMPLETE_COOKIE) === 'true';
}
