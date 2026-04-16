'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { profileEndpoints } from '@/lib/api/endpoints';
import { profileQueryKeys } from './profileQueryKeys';
import { useAuthStore } from '@/stores/authStore';
import type { ApiResponse } from '@/types/api';
import type { UserProfile, UpdateProfilePayload } from '@/types/profile';

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation<UserProfile, ApiClientError, UpdateProfilePayload>({
    mutationFn: async (payload) => {
      const res = await apiClient.patch<ApiResponse<UserProfile>>(
        profileEndpoints.update,
        payload,
      );
      return res.data;
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: profileQueryKeys.current() });

      const previous = queryClient.getQueryData<UserProfile>(
        profileQueryKeys.current(),
      );

      // Optimistically apply the patch so the UI reflects changes immediately
      queryClient.setQueryData<UserProfile>(profileQueryKeys.current(), (old) =>
        old ? { ...old, ...payload } : old,
      );

      return { previous };
    },
    onSuccess: (updated) => {
      // Sync display name / avatar back to the auth store for the header
      setUser({
        id: updated.id,
        email: updated.email,
        firstName: updated.name.split(' ')[0] ?? updated.name,
        lastName: updated.name.split(' ').slice(1).join(' ') ?? '',
        phone: updated.phoneNumber,
        countryCode: updated.address?.country ?? null,
        profileImageUrl: updated.avatarUrl,
        isEmailVerified: updated.isVerified,
        isPhoneVerified: false,
        firestoreUid: null,
        socialProvider: null,
        createdAt: updated.createdAt,
      });
    },
    onError: (_err, _vars, context) => {
      const ctx = context as { previous?: UserProfile } | undefined;
      if (ctx?.previous) {
        queryClient.setQueryData(profileQueryKeys.current(), ctx.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.current() });
    },
  });
}
