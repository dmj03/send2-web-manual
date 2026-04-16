import type { SearchFilters } from '@/types/search';

export const providerQueryKeys = {
  all: ['providers'] as const,
  lists: () => [...providerQueryKeys.all, 'list'] as const,
  search: (filters: SearchFilters) =>
    [...providerQueryKeys.all, 'search', filters] as const,
  details: () => [...providerQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...providerQueryKeys.details(), id] as const,
  reviews: (id: string) => [...providerQueryKeys.all, 'reviews', id] as const,
  compare: (ids: string[]) =>
    [...providerQueryKeys.all, 'compare', [...ids].sort()] as const,
  featured: () => [...providerQueryKeys.all, 'featured'] as const,
} as const;
