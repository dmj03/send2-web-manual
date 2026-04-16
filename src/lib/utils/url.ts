/** Subset of search filter fields used in query-string building. */
export interface SearchFilters {
  sendAmount: number;
  sendCurrency: string;
  receiveCurrency: string;
  receiveCountry: string;
  transferType: string;
  paymentMethod: string;
  page: number;
}

/**
 * Builds a `/search` URL from a partial set of SearchFilters, omitting undefined values.
 */
export function buildSearchUrl(filters: Partial<SearchFilters>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `/search?${qs}` : '/search';
}

/**
 * Parses a URLSearchParams instance into a partial SearchFilters object.
 */
export function parseSearchParams(
  searchParams: URLSearchParams,
): Partial<SearchFilters> {
  const result: Partial<SearchFilters> = {};

  const sendAmount = searchParams.get('sendAmount');
  if (sendAmount !== null) {
    const parsed = parseFloat(sendAmount);
    if (isFinite(parsed)) result.sendAmount = parsed;
  }

  const page = searchParams.get('page');
  if (page !== null) {
    const parsed = parseInt(page, 10);
    if (isFinite(parsed)) result.page = parsed;
  }

  const stringKeys = [
    'sendCurrency',
    'receiveCurrency',
    'receiveCountry',
    'transferType',
    'paymentMethod',
  ] as const;

  for (const key of stringKeys) {
    const value = searchParams.get(key);
    if (value !== null) (result as Record<string, string>)[key] = value;
  }

  return result;
}

/**
 * Builds a provider detail URL; prefers the slug when available, falls back to ID.
 */
export function buildProviderUrl(providerId: string, slug?: string): string {
  const segment = slug ? slug : providerId;
  return `/providers/${encodeURIComponent(segment)}`;
}

/**
 * Prepends NEXT_PUBLIC_SITE_URL to a relative path to produce an absolute URL.
 */
export function getAbsoluteUrl(path: string): string {
  const base =
    process.env['NEXT_PUBLIC_SITE_URL']?.replace(/\/$/, '') ?? '';
  const normalised = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalised}`;
}

/**
 * Returns true if the URL starts with a protocol scheme (e.g. http://, https://).
 */
export function isExternalUrl(url: string): boolean {
  return /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(url);
}
