/**
 * Search domain types.
 * Covers filter inputs, paginated results, sorting, and autocomplete suggestions.
 */

import type { Corridor, TransferMethod } from './provider';

/** Sort field options available on the search results page. */
export type SortField =
  | 'recipientAmount'
  | 'totalCost'
  | 'exchangeRate'
  | 'transferSpeed'
  | 'rating';

export type SortDirection = 'asc' | 'desc';

export interface SearchSort {
  field: SortField;
  direction: SortDirection;
}

/** All user-controllable filter inputs for a provider search. */
export interface SearchFilters {
  /** Amount the sender wants to send, in the send currency. */
  sendAmount: number;
  /** ISO 4217 send currency code. */
  sendCurrency: string;
  /** ISO 4217 receive currency code. */
  receiveCurrency: string;
  /** ISO 3166-1 alpha-2 receive country code. */
  receiveCountry: string;
  /** Pre-resolved corridor shorthand, if available. */
  corridor?: Corridor;
  transferMethod?: TransferMethod;
  /** Maximum acceptable fee in the send currency. */
  maxFee?: number;
  /** Minimum acceptable provider rating (0–5). */
  minRating?: number;
}

/** Paginated search results container. */
export interface SearchResults {
  results: import('./provider').ProviderResult[];
  meta: import('./api').PaginationMeta;
  /** The corridor this result set was computed for. */
  corridor: Corridor;
  /** ISO 8601 timestamp of when the rates were last refreshed. */
  lastUpdated: string;
}

/** Autocomplete suggestion entry for currency/country pickers. */
export interface SearchSuggestion {
  /** The value submitted to the search query (e.g. currency code or country code). */
  value: string;
  /** Human-readable display label (e.g. "British Pound (GBP)"). */
  label: string;
  /** Optional flag emoji or icon identifier. */
  flag?: string;
}
