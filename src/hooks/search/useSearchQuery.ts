'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { searchEndpoints } from '@/lib/api/endpoints';
import { searchQueryKeys } from './searchQueryKeys';
import type { ApiResponse } from '@/types/api';
import type { SearchFilters, SearchResults } from '@/types/search';

function buildSearchParams(filters: SearchFilters): string {
  const params = new URLSearchParams();
  params.set('sendAmount', String(filters.sendAmount));
  params.set('sendCurrency', filters.sendCurrency);
  params.set('receiveCurrency', filters.receiveCurrency);
  params.set('receiveCountry', filters.receiveCountry);
  if (filters.transferMethod) params.set('transferMethod', filters.transferMethod);
  if (filters.maxFee !== undefined) params.set('maxFee', String(filters.maxFee));
  if (filters.minRating !== undefined) params.set('minRating', String(filters.minRating));
  return params.toString();
}

export function useSearchQuery(filters: SearchFilters | null, enabled = true) {
  return useQuery<SearchResults, ApiClientError>({
    queryKey: searchQueryKeys.query(filters!),
    queryFn: async ({ signal }) => {
      const qs = buildSearchParams(filters!);
      const res = await apiClient.get<ApiResponse<SearchResults>>(
        `${searchEndpoints.query}?${qs}`,
        { signal },
      );
      return res.data;
    },
    enabled: enabled && filters !== null,
    // Always re-fetch on mount — rates change frequently
    staleTime: 0,
    // Keep previous results visible while new ones load (TQ5: placeholderData)
    placeholderData: (prev) => prev,
  });
}
