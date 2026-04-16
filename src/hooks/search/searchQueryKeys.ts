import type { SearchFilters } from '@/types/search';

export const searchQueryKeys = {
  all: ['search'] as const,
  query: (filters: SearchFilters) => [...searchQueryKeys.all, 'query', filters] as const,
  suggestions: (term: string) =>
    [...searchQueryKeys.all, 'suggestions', term] as const,
  liveRates: (fromCurrency: string, toCurrency: string) =>
    [...searchQueryKeys.all, 'liveRates', fromCurrency, toCurrency] as const,
} as const;
