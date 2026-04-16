/**
 * Typed endpoint definitions.
 * Use these constants everywhere instead of raw strings so that a URL change
 * propagates automatically and typos are caught at compile time.
 */

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const authEndpoints = {
  login: '/auth/login',
  register: '/auth/register',
  logout: '/auth/logout',
  refreshToken: '/auth/refresh',
  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',
  verifyOtp: '/auth/verify-otp',
  resendOtp: '/auth/resend-otp',
  socialLogin: (provider: 'google' | 'facebook' | 'apple') =>
    `/auth/social/${provider}`,
} as const;

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export const profileEndpoints = {
  get: '/profile/',
  update: '/profile/',
  uploadAvatar: '/profile/avatar',
  deleteAvatar: '/profile/avatar',
  changePassword: '/profile/change-password',
} as const;

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

export const providerEndpoints = {
  list: '/providers',
  search: '/providers/search',
  detail: (id: string) => `/providers/${id}`,
  reviews: (id: string) => `/providers/${id}/reviews`,
  compare: '/providers/compare',
  featured: '/providers/featured',
  bySlug: (slug: string) => `/providers/slug/${slug}`,
} as const;

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export const searchEndpoints = {
  query: '/search',
  suggest: '/search/suggest',
  liveRates: '/search/rates/live',
  corridors: '/search/corridors',
  currencies: '/search/currencies',
  countries: '/search/countries',
} as const;

// ---------------------------------------------------------------------------
// Rate Alerts
// ---------------------------------------------------------------------------

export const rateAlertEndpoints = {
  list: '/rate-alerts',
  create: '/rate-alerts',
  detail: (id: string) => `/rate-alerts/${id}`,
  update: (id: string) => `/rate-alerts/${id}`,
  delete: (id: string) => `/rate-alerts/${id}`,
  toggle: (id: string) => `/rate-alerts/${id}/toggle`,
} as const;

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export const notificationEndpoints = {
  list: '/notifications',
  markRead: (id: string) => `/notifications/${id}/read`,
  markAllRead: '/notifications/read-all',
  unreadCount: '/notifications/unread-count',
  delete: (id: string) => `/notifications/${id}`,
} as const;

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export const settingsEndpoints = {
  /** GET/PATCH account info (email, phone). */
  account: '/settings/account',
  updateEmail: '/settings/account/email',
  verifyEmailChange: '/settings/account/email/verify',
  updatePhone: '/settings/account/phone',
  verifyPhoneChange: '/settings/account/phone/verify',
  /** GET/PATCH user preferences. */
  preferences: '/settings/preferences',
  /** GET/PATCH notification channel preferences. */
  notificationPreferences: '/settings/notifications',
  /** GET 2FA status. */
  twoFactorStatus: '/settings/security/2fa',
  /** POST to initiate 2FA setup — returns otpAuthUrl + backupCodes. */
  twoFactorSetup: '/settings/security/2fa/setup',
  /** POST to confirm and activate 2FA. */
  twoFactorEnable: '/settings/security/2fa/enable',
  /** DELETE to disable 2FA. */
  twoFactorDisable: '/settings/security/2fa/disable',
  /** GET active sessions list. */
  sessions: '/settings/security/sessions',
  /** DELETE a specific session. */
  revokeSession: (sessionId: string) =>
    `/settings/security/sessions/${sessionId}`,
  /** DELETE all other sessions (keep current). */
  revokeAllSessions: '/settings/security/sessions/others',
  /** GET/PATCH privacy and consent preferences. */
  privacy: '/settings/privacy',
  /** POST to soft-delete the account. */
  deactivateAccount: '/settings/account/deactivate',
} as const;

// ---------------------------------------------------------------------------
// Content (Strapi / CMS)
// ---------------------------------------------------------------------------

export const contentEndpoints = {
  articles: '/content/articles',
  articleDetail: (slug: string) => `/content/articles/${slug}`,
  promotions: '/content/promotions',
  promotionDetail: (id: string) => `/content/promotions/${id}`,
  categories: '/content/categories',
  tags: '/content/tags',
} as const;
