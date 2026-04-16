/**
 * Barrel export for the entire src/types layer.
 * Import from '@/types' rather than individual files.
 */

export type {
  ApiResponse,
  ApiError,
  PaginationMeta,
  ApiResult,
} from './api';

export type {
  UserRole,
  User,
  AuthSession,
  LoginCredentials,
  RegisterPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  VerifyOtpPayload,
} from './auth';

export type {
  TransferMethod,
  Corridor,
  FeeTier,
  ProviderFee,
  SpeedEstimate,
  Provider,
  ProviderResult,
} from './provider';

export type {
  SortField,
  SortDirection,
  SearchSort,
  SearchFilters,
  SearchResults,
  SearchSuggestion,
} from './search';

export type {
  NotificationChannel,
  RateAlert,
  CreateRateAlertPayload,
} from './rate-alert';

export type {
  NotificationType,
  AppNotification,
} from './notification';

export type {
  ArticleCategory,
  Author,
  Article,
  DiscountType,
  Promotion,
} from './content';

export type {
  Address,
  UserProfile,
  UpdateProfilePayload,
} from './profile';

export type { NavItem } from './navigation';

export type {
  ToastType,
  Theme,
  ToastAction,
  Toast,
  ModalConfig,
  Breadcrumb,
} from './ui';
