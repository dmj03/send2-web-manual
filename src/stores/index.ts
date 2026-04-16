// Auth
export {
  useAuthStore,
  selectUser,
  selectIsAuthenticated,
  selectAuthError,
  selectToken,
} from './authStore';
export type { AuthUser, AuthState, AuthActions } from './authStore';

// Search
export {
  useSearchStore,
  selectFilters,
  selectResults,
  selectPagination,
  selectIsSearching,
} from './searchStore';
export type {
  SearchFilters,
  ProviderResult,
  Pagination,
  SearchState,
  SearchActions,
} from './searchStore';

// Compare
export {
  useCompareStore,
  selectBasket,
  selectBasketCount,
  selectIsInBasket,
  selectIsDrawerOpen,
} from './compareStore';
export type { CompareState, CompareActions } from './compareStore';

// Rate Alerts
export {
  useRateAlertStore,
  selectAlerts,
  selectActiveAlerts,
  selectRateAlertError,
} from './rateAlertStore';
export type { RateAlert, RateAlertState, RateAlertActions } from './rateAlertStore';

// Notifications
export {
  useNotificationStore,
  selectNotifications,
  selectUnreadCount,
  selectUnreadNotifications,
} from './notificationStore';
export type {
  AppNotification,
  NotificationState,
  NotificationActions,
} from './notificationStore';

// UI
export {
  useUiStore,
  selectTheme,
  selectToasts,
  selectActiveModal,
  selectGlobalLoading,
  selectLocale,
} from './uiStore';
export type { Toast, Theme, UiState, UiActions } from './uiStore';
