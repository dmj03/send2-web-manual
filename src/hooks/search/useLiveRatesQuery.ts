'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { searchEndpoints } from '@/lib/api/endpoints';
import { searchQueryKeys } from './searchQueryKeys';
import type { ApiResponse } from '@/types/api';

export interface LiveRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  /** ISO 8601 timestamp of when this rate was fetched from the provider. */
  fetchedAt: string;
}

export function useLiveRatesQuery(
  fromCurrency: string,
  toCurrency: string,
  enabled = true,
) {
  return useQuery<LiveRate, ApiClientError>({
    queryKey: searchQueryKeys.liveRates(fromCurrency, toCurrency),
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ fromCurrency, toCurrency });
      const res = await apiClient.get<ApiResponse<LiveRate>>(
        `${searchEndpoints.liveRates}?${params.toString()}`,
        { signal },
      );
      return res.data;
    },
    enabled: enabled && !!fromCurrency && !!toCurrency,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
