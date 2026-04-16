'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';
import type { ApiResponse } from '@/types/api';

export interface ReferralInfo {
  code: string;
  referralUrl: string;
  totalReferrals: number;
  pendingRewards: number;
  totalEarned: number;
  currency: string;
}

const referralKeys = {
  all: ['referral'] as const,
  info: () => [...referralKeys.all, 'info'] as const,
} as const;

export function useReferralQuery() {
  const isAuthenticated = useAuthStore((s) => s.token !== null);

  return useQuery<ReferralInfo, ApiClientError>({
    queryKey: referralKeys.info(),
    queryFn: async ({ signal }) => {
      const res = await apiClient.get<ApiResponse<ReferralInfo>>(
        '/profile/referral',
        { signal },
      );
      return res.data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60_000,
  });
}
