'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { profileEndpoints } from '@/lib/api/endpoints';
import { profileQueryKeys } from './profileQueryKeys';
import { useAuthStore } from '@/stores/authStore';
import type { ApiResponse } from '@/types/api';
import type { UserProfile } from '@/types/profile';

export function useProfileQuery() {
  const isAuthenticated = useAuthStore((s) => s.token !== null);

  return useQuery<UserProfile, ApiClientError>({
    queryKey: profileQueryKeys.current(),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<ApiResponse<UserProfile>>(
        profileEndpoints.get,
        { signal },
      );
      return res.data;
    },
    enabled: isAuthenticated,
  });
}
