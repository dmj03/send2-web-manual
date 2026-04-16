'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useChangePasswordMutation } from '@/features/profile/hooks/useChangePasswordMutation';

// ─── Schema ───────────────────────────────────────────────────────────────────

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

// ─── Password visibility toggle ───────────────────────────────────────────────

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ChangePasswordForm() {
  const mutation = useChangePasswordMutation();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  function onSubmit(values: ChangePasswordValues) {
    mutation.mutate(
      {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      },
      { onSuccess: () => reset() },
    );
  }

  const isPending = isSubmitting || mutation.isPending;

  const INPUT_CLS =
    'block w-full rounded-xl border border-gray-300 px-4 py-2.5 pr-11 text-sm text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 aria-invalid:border-red-400';

  function PasswordInput({
    id,
    show,
    onToggle,
    reg,
    placeholder,
    invalid,
  }: {
    id: string;
    show: boolean;
    onToggle: () => void;
    reg: ReturnType<typeof register>;
    placeholder: string;
    invalid: boolean;
  }) {
    return (
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete={id === 'currentPassword' ? 'current-password' : 'new-password'}
          {...reg}
          aria-invalid={invalid}
          placeholder={placeholder}
          className={INPUT_CLS}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
        >
          <EyeIcon open={show} />
        </button>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="change-password-heading"
      className="rounded-2xl border bg-white p-6 shadow-sm"
    >
      <h2 id="change-password-heading" className="mb-5 text-base font-semibold text-gray-900">
        Change password
      </h2>

      {mutation.isError && (
        <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {mutation.error.message || 'Password change failed. Please try again.'}
        </div>
      )}

      {mutation.isSuccess && (
        <div role="status" className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Password updated successfully.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="currentPassword" className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Current password
          </label>
          <PasswordInput
            id="currentPassword"
            show={showCurrent}
            onToggle={() => setShowCurrent((v) => !v)}
            reg={register('currentPassword')}
            placeholder="Your current password"
            invalid={!!errors.currentPassword}
          />
          {errors.currentPassword && (
            <p role="alert" className="text-xs text-red-600">{errors.currentPassword.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="newPassword" className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
            New password
          </label>
          <PasswordInput
            id="newPassword"
            show={showNew}
            onToggle={() => setShowNew((v) => !v)}
            reg={register('newPassword')}
            placeholder="At least 8 characters"
            invalid={!!errors.newPassword}
          />
          {errors.newPassword ? (
            <p role="alert" className="text-xs text-red-600">{errors.newPassword.message}</p>
          ) : (
            <p className="text-xs text-gray-400">
              Minimum 8 characters · 1 uppercase letter · 1 number
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Confirm new password
          </label>
          <PasswordInput
            id="confirmPassword"
            show={showConfirm}
            onToggle={() => setShowConfirm((v) => !v)}
            reg={register('confirmPassword')}
            placeholder="Repeat new password"
            invalid={!!errors.confirmPassword}
          />
          {errors.confirmPassword && (
            <p role="alert" className="text-xs text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Updating…
            </>
          ) : (
            'Update password'
          )}
        </button>
      </form>
    </section>
  );
}
