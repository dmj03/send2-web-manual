'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';
import { useAvatarUploadMutation } from '@/features/profile/hooks/useAvatarUploadMutation';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function ProfileAvatar() {
  const user = useAuthStore((s) => s.user);
  const isUpdating = useAuthStore((s) => s.isProfileImageUpdating);
  const uploadMutation = useAvatarUploadMutation();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert('Please upload a JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      alert('Image must be smaller than 5 MB.');
      return;
    }

    uploadMutation.mutate(file);
    // Reset input so the same file can be re-selected if needed
    if (inputRef.current) inputRef.current.value = '';
  }

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : '?';

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        {user?.profileImageUrl ? (
          <Image
            src={user.profileImageUrl}
            alt={`${user.firstName} ${user.lastName}`}
            width={96}
            height={96}
            className="rounded-full object-cover ring-2 ring-blue-100"
          />
        ) : (
          <div
            className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-3xl font-bold text-blue-700"
            aria-label={`Avatar for ${user?.firstName ?? 'user'}`}
          >
            {initials}
          </div>
        )}

        {/* Upload overlay */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUpdating}
          aria-label="Change profile photo"
          className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUpdating ? (
            <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </button>
      </div>

      {uploadMutation.isError && (
        <p role="alert" className="text-xs text-red-600">
          {uploadMutation.error.message}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="sr-only"
        aria-hidden="true"
        onChange={handleFileChange}
      />
    </div>
  );
}
