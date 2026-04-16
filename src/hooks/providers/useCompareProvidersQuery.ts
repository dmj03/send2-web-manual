'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { providerEndpoints } from '@/lib/api/endpoints';
import { providerQueryKeys } from './providerQueryKeys';
import type { ApiResponse } from '@/types/api';
import type { Provider } from '@/types/provider';

export function useCompareProvidersQuery(ids: string[], enabled = true) {
  return useQuery<Provider[], ApiClientError>({
    queryKey: providerQueryKeys.compare(ids),
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams();
      ids.forEach((id) => params.append('ids', id));
      const res = await apiClient.get<ApiResponse<Provider[]>>(
        `${providerEndpoints.compare}?${params.toString()}`,
        { signal },
      );
      return res.data;
    },
    enabled: enabled && ids.length > 0,
  });
}
