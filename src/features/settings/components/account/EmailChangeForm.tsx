'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/stores/authStore';
import { useUpdateEmailMutation } from '@/features/settings/hooks/useUpdateEmailMutation';
import { SettingsSectionCard } from '../SettingsSectionCard';

const schema = z.object({
  newEmail: z.string().email('Enter a valid email address'),
  currentPassword: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

export function EmailChangeForm() {
  const currentEmail = useAuthStore((s) => s.user?.email ?? '');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const mutation = useUpdateEmailMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setSuccessMessage(null);
    mutation.mutate(values, {
      onSuccess: (data) => {
        setSuccessMessage(
          data.verificationRequired
            ? 'Check your new inbox — we sent a verification link.'
            : 'Email address updated successfully.',
        );
        reset();
      },
    });
  }

  return (
    <SettingsSectionCard
      title="Email address"
      description={`Current email: ${currentEmail}`}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* Success banner */}
        {successMessage && (
          <div
            role="status"
            className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          >
            {successMessage}
          </div>
        )}

        {/* API error banner */}
        {mutation.isError && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {mutation.error.message}
          </div>
        )}

        {/* New email */}
        <div>
          <label
            htmlFor="newEmail"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            New email address
          </label>
          <input
            id="newEmail"
            type="email"
            autoComplete="email"
            {...register('newEmail')}
            aria-invalid={errors.newEmail ? 'true' : undefined}
            aria-describedby={errors.newEmail ? 'newEmail-error' : undefined}
            className="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 aria-[invalid]:border-red-400"
            placeholder="you@example.com"
          />
          {errors.newEmail && (
            <p id="newEmail-error" role="alert" className="mt-1 text-xs text-red-600">
              {errors.newEmail.message}
            </p>
          )}
        </div>

        {/* Current password */}
        <div>
          <label
            htmlFor="emailCurrentPassword"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Current password
          </label>
          <input
            id="emailCurrentPassword"
            type="password"
            autoComplete="current-password"
            {...register('currentPassword')}
            aria-invalid={errors.currentPassword ? 'true' : undefined}
            aria-describedby={errors.currentPassword ? 'emailCurrentPassword-error' : undefined}
            className="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 aria-[invalid]:border-red-400"
            placeholder="Enter your current password"
          />
          {errors.currentPassword && (
            <p id="emailCurrentPassword-error" role="alert" className="mt-1 text-xs text-red-600">
              {errors.currentPassword.message}
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || mutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mutation.isPending && (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            Update email
          </button>
        </div>
      </form>
    </SettingsSectionCard>
  );
}
