'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { providerEndpoints } from '@/lib/api/endpoints';
import { providerQueryKeys } from './providerQueryKeys';
import type { ApiResponse, PaginationMeta } from '@/types/api';

export interface ProviderReview {
  id: string;
  providerId: string;
  userId: string;
  /** Display name of the reviewer. */
  userName: string;
  /** Reviewer avatar URL, or null. */
  userAvatarUrl: string | null;
  rating: number;
  title: string;
  body: string;
  /** ISO 8601 timestamp. */
  createdAt: string;
  isVerified: boolean;
}

interface ReviewsPage {
  reviews: ProviderReview[];
  meta: PaginationMeta;
}

const PAGE_SIZE = 10;

export function useProviderReviewsQuery(providerId: string, enabled = true) {
  return useInfiniteQuery<ReviewsPage, ApiClientError>({
    queryKey: providerQueryKeys.reviews(providerId),
    queryFn: async ({ pageParam = 1, signal }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        perPage: String(PAGE_SIZE),
      });
      const res = await apiClient.get<ApiResponse<ProviderReview[]>>(
        `${providerEndpoints.reviews(providerId)}?${params.toString()}`,
        { signal },
      );
      return {
        reviews: res.data,
        meta: res.meta!,
      };
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? lastPage.meta.page + 1 : undefined,
    enabled: enabled && !!providerId,
  });
}
