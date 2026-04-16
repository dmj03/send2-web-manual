'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { contentEndpoints } from '@/lib/api/endpoints';
import { contentQueryKeys } from './contentQueryKeys';
import type { ApiResponse, PaginationMeta } from '@/types/api';
import type { Article, ArticleCategory } from '@/types/content';

interface ArticlesPage {
  articles: Article[];
  meta: PaginationMeta;
}

const PAGE_SIZE = 12;

export function useArticlesQuery(category?: ArticleCategory, enabled = true) {
  return useInfiniteQuery<ArticlesPage, ApiClientError>({
    queryKey: contentQueryKeys.articleList(category),
    queryFn: async ({ pageParam = 1, signal }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        perPage: String(PAGE_SIZE),
      });
      if (category) params.set('category', category);

      const res = await apiClient.get<ApiResponse<Article[]>>(
        `${contentEndpoints.articles}?${params.toString()}`,
        { signal },
      );
      return { articles: res.data, meta: res.meta! };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? lastPage.meta.page + 1 : undefined,
    enabled,
    staleTime: 5 * 60_000,
  });
}
