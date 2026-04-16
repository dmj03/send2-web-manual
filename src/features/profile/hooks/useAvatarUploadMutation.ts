'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClientError } from '@/lib/api/client';
import { profileEndpoints } from '@/lib/api/endpoints';
import { profileQueryKeys } from '@/hooks/profile';
import { useAuthStore } from '@/stores/authStore';
import type { ApiResponse } from '@/types/api';
import type { UserProfile } from '@/types/profile';

export function useAvatarUploadMutation() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const setProfileImageUpdating = useAuthStore((s) => s.setProfileImageUpdating);

  return useMutation<UserProfile, ApiClientError, File>({
    mutationFn: async (file) => {
      const token = useAuthStore.getState().token;
      const baseUrl =
        process.env['NEXT_PUBLIC_API_BASE_URL']?.replace(/\/$/, '') ?? '';

      const formData = new FormData();
      formData.append('avatar', file);

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${baseUrl}${profileEndpoints.uploadAvatar}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          message?: string;
          code?: string;
        };
        throw new ApiClientError(
          {
            code: body.code ?? 'UPLOAD_FAILED',
            message: body.message ?? 'Avatar upload failed. Please try again.',
          },
          res.status,
        );
      }

      const envelope = (await res.json()) as ApiResponse<UserProfile>;
      return envelope.data;
    },

    onMutate: () => setProfileImageUpdating(true),

    onSettled: () => setProfileImageUpdating(false),

    onSuccess: (updated) => {
      const nameParts = updated.name.split(' ');
      setUser({
        id: updated.id,
        email: updated.email,
        firstName: nameParts[0] ?? updated.name,
        lastName: nameParts.slice(1).join(' '),
        phone: updated.phoneNumber,
        countryCode: updated.address?.country ?? null,
        profileImageUrl: updated.avatarUrl,
        isEmailVerified: updated.isVerified,
        isPhoneVerified: false,
        firestoreUid: null,
        socialProvider: null,
        createdAt: updated.createdAt,
      });
      void queryClient.invalidateQueries({ queryKey: profileQueryKeys.current() });
    },
  });
}
