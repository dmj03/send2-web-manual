'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { contentEndpoints } from '@/lib/api/endpoints';
import { contentQueryKeys } from './contentQueryKeys';
import type { ApiResponse } from '@/types/api';
import type { Promotion } from '@/types/content';

export function usePromotionsQuery(providerId?: string, enabled = true) {
  return useQuery<Promotion[], ApiClientError>({
    queryKey: contentQueryKeys.promotionList(providerId),
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams();
      if (providerId) params.set('providerId', providerId);
      const qs = params.toString();

      const res = await apiClient.get<ApiResponse<Promotion[]>>(
        `${contentEndpoints.promotions}${qs ? `?${qs}` : ''}`,
        { signal },
      );
      return res.data;
    },
    enabled,
    staleTime: 5 * 60_000,
  });
}
