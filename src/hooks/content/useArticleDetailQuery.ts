'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { contentEndpoints } from '@/lib/api/endpoints';
import { contentQueryKeys } from './contentQueryKeys';
import type { ApiResponse } from '@/types/api';
import type { Article } from '@/types/content';

export function useArticleDetailQuery(slug: string | null | undefined) {
  return useQuery<Article, ApiClientError>({
    queryKey: contentQueryKeys.articleDetail(slug ?? ''),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<ApiResponse<Article>>(
        contentEndpoints.articleDetail(slug!),
        { signal },
      );
      return res.data;
    },
    enabled: !!slug,
    staleTime: 5 * 60_000,
  });
}
