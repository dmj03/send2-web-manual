/**
 * Base API client — thin fetch wrapper used by all TanStack Query hooks.
 * Reads the auth token from Zustand outside React via `getState()`.
 */

import { useAuthStore } from '@/stores/authStore';
import type { ApiError } from '@/types/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RequestConfig {
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

/** Shape thrown on non-2xx responses. Extends the `ApiError` contract. */
export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;
  readonly field?: string;

  constructor(apiError: ApiError, status: number) {
    super(apiError.message);
    this.name = 'ApiClientError';
    this.code = apiError.code;
    this.status = status;
    if (apiError.field !== undefined) {
      this.field = apiError.field;
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getBaseUrl(): string {
  const url = process.env['NEXT_PUBLIC_API_BASE_URL'];
  if (!url) throw new Error('NEXT_PUBLIC_API_BASE_URL is not set');
  return url.replace(/\/$/, '');
}

function buildHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...extra,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) {
    // 204 No Content — return empty object
    if (res.status === 204) return {} as T;
    return res.json() as Promise<T>;
  }

  // Try to parse a structured error body; fall back to a generic one
  let apiError: ApiError;
  try {
    const body = (await res.json()) as Partial<ApiError>;
    apiError = {
      code: body.code ?? 'UNKNOWN_ERROR',
      message: body.message ?? res.statusText,
      ...(body.field !== undefined ? { field: body.field } : {}),
    };
  } catch {
    apiError = {
      code: 'NETWORK_ERROR',
      message: res.statusText || `HTTP ${res.status}`,
    };
  }

  throw new ApiClientError(apiError, res.status);
}

// ---------------------------------------------------------------------------
// API client singleton
// ---------------------------------------------------------------------------

export const apiClient = {
  /** GET request — T should be the full response body type (usually `ApiResponse<X>`). */
  async get<T>(path: string, config?: RequestConfig): Promise<T> {
    const options: RequestInit = {
      method: 'GET',
      headers: buildHeaders(config?.headers),
    };
    if (config?.signal !== undefined) options.signal = config.signal;
    const res = await fetch(`${getBaseUrl()}${path}`, options);
    return handleResponse<T>(res);
  },

  /** POST request. */
  async post<T>(path: string, body?: unknown, config?: RequestConfig): Promise<T> {
    const options: RequestInit = {
      method: 'POST',
      headers: buildHeaders(config?.headers),
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    };
    if (config?.signal !== undefined) options.signal = config.signal;
    const res = await fetch(`${getBaseUrl()}${path}`, options);
    return handleResponse<T>(res);
  },

  /** PUT request. */
  async put<T>(path: string, body?: unknown, config?: RequestConfig): Promise<T> {
    const options: RequestInit = {
      method: 'PUT',
      headers: buildHeaders(config?.headers),
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    };
    if (config?.signal !== undefined) options.signal = config.signal;
    const res = await fetch(`${getBaseUrl()}${path}`, options);
    return handleResponse<T>(res);
  },

  /** PATCH request. */
  async patch<T>(path: string, body?: unknown, config?: RequestConfig): Promise<T> {
    const options: RequestInit = {
      method: 'PATCH',
      headers: buildHeaders(config?.headers),
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    };
    if (config?.signal !== undefined) options.signal = config.signal;
    const res = await fetch(`${getBaseUrl()}${path}`, options);
    return handleResponse<T>(res);
  },

  /** DELETE request. */
  async delete<T>(path: string, config?: RequestConfig): Promise<T> {
    const options: RequestInit = {
      method: 'DELETE',
      headers: buildHeaders(config?.headers),
    };
    if (config?.signal !== undefined) options.signal = config.signal;
    const res = await fetch(`${getBaseUrl()}${path}`, options);
    return handleResponse<T>(res);
  },
} as const;
