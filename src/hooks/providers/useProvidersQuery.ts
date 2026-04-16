'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { providerEndpoints } from '@/lib/api/endpoints';
import { providerQueryKeys } from './providerQueryKeys';
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

export function useProvidersQuery(filters: SearchFilters, enabled = true) {
  return useQuery<SearchResults, ApiClientError>({
    queryKey: providerQueryKeys.search(filters),
    queryFn: async ({ signal }) => {
      const qs = buildSearchParams(filters);
      const res = await apiClient.get<ApiResponse<SearchResults>>(
        `${providerEndpoints.search}?${qs}`,
        { signal },
      );
      return res.data;
    },
    enabled,
    staleTime: 0,
  });
}
