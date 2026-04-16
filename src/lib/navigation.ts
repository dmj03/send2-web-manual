/**
 * Typed route constants and navigation helpers for the Send2 Next.js app.
 *
 * Usage:
 *   import { ROUTES, buildSearchUrl } from '@/lib/navigation';
 *   <Link href={ROUTES.auth.login} />
 *   router.push(buildSearchUrl({ fromCurrency: 'GBP', toCurrency: 'PHP' }));
 */

// ─── Route constants ─────────────────────────────────────────────────────────

export const ROUTES = {
  // Public
  home: '/',
  search: '/search',
  aboutUs: '/about-us',
  contactUs: '/contact-us',
  faq: '/faq',
  terms: '/terms',
  privacy: '/privacy',
  cookiePolicy: '/cookie-policy',

  // Providers
  providers: {
    list: '/providers',
    detail: (slug: string) => `/providers/${encodeURIComponent(slug)}`,
  },

  // Content
  blog: {
    index: '/blog',
    post: (slug: string) => `/blog/${encodeURIComponent(slug)}`,
  },
  news: {
    index: '/news',
    post: (slug: string) => `/news/${encodeURIComponent(slug)}`,
  },

  // Auth
  auth: {
    login: '/authentication/login',
    register: '/authentication/registration',
    registerOtp: '/authentication/registration/otp',
    setRateAlert: '/authentication/registration/set-rate-alert',
    forgotPassword: '/authentication/forgot-password',
    forgotPasswordOtp: '/authentication/forgot-password/otp',
    changePassword: '/authentication/change-password',
    otp: '/authentication/otp',
    reactivate: '/authentication/reactivate',
  },

  // Protected — profile
  profile: {
    setup: '/profile/setup',
    dashboard: '/profile/dashboard',
    personalInfo: '/profile/personal-info',
    rateAlerts: '/profile/rate-alerts',
    notifications: '/profile/notifications',
    searchHistory: '/profile/search-history',
    referral: '/profile/referral',
    consent: '/profile/consent',
  },

  // Settings
  settings: {
    index: '/settings',
    account: '/settings/account',
    security: '/settings/security',
    preferences: '/settings/preferences',
    notifications: '/settings/notifications',
    privacy: '/settings/privacy',
  },

  // Compare
  compare: '/compare',
} as const;

// ─── Search URL builder ───────────────────────────────────────────────────────

export interface SearchParams {
  fromCurrency?: string;
  toCurrency?: string;
  amount?: string | number;
  fromCountry?: string;
  toCountry?: string;
}

/**
 * Build a type-safe URL for the /search page, serialising only
 * the params that are actually present.
 */
export function buildSearchUrl(params: SearchParams): string {
  const qs = new URLSearchParams();

  if (params.fromCurrency) qs.set('fromCurrency', params.fromCurrency);
  if (params.toCurrency) qs.set('toCurrency', params.toCurrency);
  if (params.amount != null) qs.set('amount', String(params.amount));
  if (params.fromCountry) qs.set('fromCountry', params.fromCountry);
  if (params.toCountry) qs.set('toCountry', params.toCountry);

  const query = qs.toString();
  return query ? `/search?${query}` : '/search';
}

// ─── Login redirect URL builder ──────────────────────────────────────────────

/**
 * Build a login URL with an optional `callbackUrl` so the user is
 * returned to the intended page after authentication.
 */
export function buildLoginUrl(callbackUrl?: string): string {
  if (!callbackUrl) return ROUTES.auth.login;
  const qs = new URLSearchParams({ callbackUrl });
  return `${ROUTES.auth.login}?${qs.toString()}`;
}

// ─── Route-group membership helpers ──────────────────────────────────────────

export function isAuthRoute(pathname: string): boolean {
  return pathname.startsWith('/authentication');
}

export function isProtectedRoute(pathname: string): boolean {
  return pathname.startsWith('/profile');
}

export function isPublicRoute(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname.startsWith('/search') ||
    pathname.startsWith('/providers') ||
    pathname.startsWith('/blog') ||
    pathname.startsWith('/news') ||
    pathname === '/about-us' ||
    pathname === '/contact-us' ||
    pathname === '/faq' ||
    pathname === '/terms' ||
    pathname === '/privacy' ||
    pathname === '/cookie-policy'
  );
}
