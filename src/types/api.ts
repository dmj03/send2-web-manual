/**
 * Global API response envelope types.
 * All HTTP responses from the Send2 backend are wrapped in these shapes.
 */

/** Generic success envelope returned by every API endpoint. */
export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
  message?: string;
}

/** Structured error returned by the API on 4xx/5xx responses. */
export interface ApiError {
  /** Machine-readable error code (e.g. "INVALID_CREDENTIALS", "RATE_LIMIT_EXCEEDED"). */
  code: string;
  /** Field name if the error is field-level (e.g. "email"), otherwise undefined. */
  field?: string;
  /** Human-readable error description safe to surface in the UI. */
  message: string;
}

/** Pagination metadata included when the response is a list resource. */
export interface PaginationMeta {
  /** Total number of items across all pages. */
  total: number;
  /** Current page number (1-indexed). */
  page: number;
  /** Number of items per page. */
  perPage: number;
  /** Index of the last available page. */
  lastPage: number;
  /** Whether a subsequent page exists. */
  hasMore: boolean;
}

/** Discriminated union for async operations — use instead of try/catch at call sites. */
export type ApiResult<T> =
  | { ok: true; data: T; meta?: PaginationMeta }
  | { ok: false; error: ApiError };
