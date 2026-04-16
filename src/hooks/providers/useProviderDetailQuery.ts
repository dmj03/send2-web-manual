'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { providerEndpoints } from '@/lib/api/endpoints';
import { providerQueryKeys } from './providerQueryKeys';
import type { ApiResponse } from '@/types/api';
import type { Provider } from '@/types/provider';

export function useProviderDetailQuery(id: string | null | undefined) {
  return useQuery<Provider, ApiClientError>({
    queryKey: providerQueryKeys.detail(id ?? ''),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<ApiResponse<Provider>>(
        providerEndpoints.detail(id!),
        { signal },
      );
      return res.data;
    },
    enabled: !!id,
  });
}
