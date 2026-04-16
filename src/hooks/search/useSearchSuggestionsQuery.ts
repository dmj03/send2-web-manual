'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { searchEndpoints } from '@/lib/api/endpoints';
import { searchQueryKeys } from './searchQueryKeys';
import type { ApiResponse } from '@/types/api';
import type { SearchSuggestion } from '@/types/search';

const DEBOUNCE_MS = 200;
const MIN_TERM_LENGTH = 2;

export function useSearchSuggestionsQuery(term: string) {
  const [debouncedTerm, setDebouncedTerm] = useState(term);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(term), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [term]);

  return useQuery<SearchSuggestion[], ApiClientError>({
    queryKey: searchQueryKeys.suggestions(debouncedTerm),
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ q: debouncedTerm });
      const res = await apiClient.get<ApiResponse<SearchSuggestion[]>>(
        `${searchEndpoints.suggest}?${params.toString()}`,
        { signal },
      );
      return res.data;
    },
    enabled: debouncedTerm.length >= MIN_TERM_LENGTH,
    staleTime: 30_000,
  });
}
