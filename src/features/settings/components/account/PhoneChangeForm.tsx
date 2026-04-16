'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/stores/authStore';
import { useUpdatePhoneMutation } from '@/features/settings/hooks/useUpdatePhoneMutation';
import { SettingsSectionCard } from '../SettingsSectionCard';

const schema = z.object({
  newPhone: z
    .string()
    .min(7, 'Enter a valid phone number')
    .regex(/^\+?[0-9\s\-()]+$/, 'Enter a valid phone number'),
  countryCode: z.string().length(2, 'Select a country code'),
});

type FormValues = z.infer<typeof schema>;

// Abbreviated list of major country dialling codes for the selector
const COUNTRY_OPTIONS = [
  { code: 'GB', label: 'United Kingdom (+44)' },
  { code: 'US', label: 'United States (+1)' },
  { code: 'NG', label: 'Nigeria (+234)' },
  { code: 'GH', label: 'Ghana (+233)' },
  { code: 'KE', label: 'Kenya (+254)' },
  { code: 'IN', label: 'India (+91)' },
  { code: 'PK', label: 'Pakistan (+92)' },
  { code: 'PH', label: 'Philippines (+63)' },
  { code: 'AU', label: 'Australia (+61)' },
  { code: 'CA', label: 'Canada (+1)' },
] as const;

export function PhoneChangeForm() {
  const currentPhone = useAuthStore((s) => s.user?.phone ?? null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const mutation = useUpdatePhoneMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { countryCode: 'GB' },
  });

  async function onSubmit(values: FormValues) {
    setSuccessMessage(null);
    mutation.mutate(values, {
      onSuccess: (data) => {
        setSuccessMessage(
          data.verificationRequired
            ? 'Enter the OTP we sent to your new number to confirm the change.'
            : 'Phone number updated successfully.',
        );
        reset({ countryCode: 'GB' });
      },
    });
  }

  return (
    <SettingsSectionCard
      title="Phone number"
      description={
        currentPhone
          ? `Current number: ${currentPhone}`
          : 'No phone number on file.'
      }
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

        <div className="flex gap-3">
          {/* Country code selector */}
          <div className="w-48 shrink-0">
            <label
              htmlFor="countryCode"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Country
            </label>
            <select
              id="countryCode"
              {...register('countryCode')}
              aria-invalid={errors.countryCode ? 'true' : undefined}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 aria-[invalid]:border-red-400"
            >
              {COUNTRY_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.countryCode && (
              <p role="alert" className="mt-1 text-xs text-red-600">
                {errors.countryCode.message}
              </p>
            )}
          </div>

          {/* Phone number input */}
          <div className="flex-1">
            <label
              htmlFor="newPhone"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              New phone number
            </label>
            <input
              id="newPhone"
              type="tel"
              autoComplete="tel"
              {...register('newPhone')}
              aria-invalid={errors.newPhone ? 'true' : undefined}
              aria-describedby={errors.newPhone ? 'newPhone-error' : undefined}
              className="block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 aria-[invalid]:border-red-400"
              placeholder="+44 7700 900123"
            />
            {errors.newPhone && (
              <p id="newPhone-error" role="alert" className="mt-1 text-xs text-red-600">
                {errors.newPhone.message}
              </p>
            )}
          </div>
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
            Update phone
          </button>
        </div>
      </form>
    </SettingsSectionCard>
  );
}
