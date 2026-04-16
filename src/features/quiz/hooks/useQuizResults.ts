'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { providerEndpoints } from '@/lib/api/endpoints';
import type { ApiResponse } from '@/types/api';
import type { SearchFilters, SearchResults, SortField } from '@/types/search';
import type { ProviderResult } from '@/types/provider';
import {
  quizAnswersToSearchFilters,
  quizPriorityToSortField,
  type QuizAnswers,
  type PriorityValue,
} from '../types';

function buildSearchParams(filters: SearchFilters, sortField: SortField): string {
  const params = new URLSearchParams();
  params.set('sendAmount', String(filters.sendAmount));
  params.set('sendCurrency', filters.sendCurrency);
  params.set('receiveCurrency', filters.receiveCurrency);
  params.set('receiveCountry', filters.receiveCountry);
  params.set('sort', sortField);
  params.set('direction', sortField === 'rating' || sortField === 'recipientAmount' ? 'desc' : 'asc');
  if (filters.transferMethod) params.set('transferMethod', filters.transferMethod);
  return params.toString();
}

export interface UseQuizResultsReturn {
  results: ProviderResult[];
  isLoading: boolean;
  isError: boolean;
  error: ApiClientError | null;
  lastUpdated: string | null;
  sortField: SortField;
  searchFilters: SearchFilters | null;
  refetch: () => void;
}

export function useQuizResults(
  answers: QuizAnswers,
  enabled: boolean,
): UseQuizResultsReturn {
  const searchFilters = quizAnswersToSearchFilters(answers);
  const sortField = quizPriorityToSortField(answers.priority as PriorityValue | null);

  const query = useQuery<SearchResults, ApiClientError>({
    queryKey: ['quiz', 'results', searchFilters, sortField],
    queryFn: async ({ signal }) => {
      if (!searchFilters) throw new Error('Incomplete quiz answers');
      const qs = buildSearchParams(searchFilters, sortField);
      const res = await apiClient.get<ApiResponse<SearchResults>>(
        `${providerEndpoints.search}?${qs}`,
        { signal },
      );
      return res.data;
    },
    enabled: enabled && searchFilters !== null,
    staleTime: 60_000,
  });

  return {
    results: query.data?.results ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error ?? null,
    lastUpdated: query.data?.lastUpdated ?? null,
    sortField,
    searchFilters,
    refetch: query.refetch,
  };
}
