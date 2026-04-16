'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePreferencesQuery } from '@/features/settings/hooks/usePreferencesQuery';
import { useUpdatePreferencesMutation } from '@/features/settings/hooks/useUpdatePreferencesMutation';
import { SettingsSectionCard } from '../SettingsSectionCard';

const schema = z.object({
  preferredSendCurrency: z.string().length(3, 'Select a currency'),
  preferredReceiveCountry: z.string().length(2, 'Select a country'),
  displayCurrency: z.string().length(3, 'Select a currency'),
  language: z.string().min(2, 'Select a language'),
});

type FormValues = z.infer<typeof schema>;

const CURRENCIES = [
  { code: 'GBP', label: 'British Pound (GBP)' },
  { code: 'EUR', label: 'Euro (EUR)' },
  { code: 'USD', label: 'US Dollar (USD)' },
  { code: 'AUD', label: 'Australian Dollar (AUD)' },
  { code: 'CAD', label: 'Canadian Dollar (CAD)' },
  { code: 'NOK', label: 'Norwegian Krone (NOK)' },
  { code: 'SEK', label: 'Swedish Krona (SEK)' },
  { code: 'DKK', label: 'Danish Krone (DKK)' },
] as const;

const RECEIVE_COUNTRIES = [
  { code: 'NG', label: 'Nigeria' },
  { code: 'GH', label: 'Ghana' },
  { code: 'KE', label: 'Kenya' },
  { code: 'IN', label: 'India' },
  { code: 'PK', label: 'Pakistan' },
  { code: 'PH', label: 'Philippines' },
  { code: 'ZA', label: 'South Africa' },
  { code: 'EG', label: 'Egypt' },
  { code: 'MA', label: 'Morocco' },
  { code: 'MX', label: 'Mexico' },
  { code: 'BD', label: 'Bangladesh' },
  { code: 'LK', label: 'Sri Lanka' },
] as const;

const LANGUAGES = [
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' },
] as const;

export function PreferencesForm() {
  const { data: prefs, isLoading, isError, error } = usePreferencesQuery();
  const mutation = useUpdatePreferencesMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  // Populate once data arrives
  useEffect(() => {
    if (prefs) {
      reset({
        preferredSendCurrency: prefs.preferredSendCurrency,
        preferredReceiveCountry: prefs.preferredReceiveCountry,
        displayCurrency: prefs.displayCurrency,
        language: prefs.language,
      });
    }
  }, [prefs, reset]);

  function onSubmit(values: FormValues) {
    mutation.mutate(values, {
      onSuccess: (updated) => {
        reset({
          preferredSendCurrency: updated.preferredSendCurrency,
          preferredReceiveCountry: updated.preferredReceiveCountry,
          displayCurrency: updated.displayCurrency,
          language: updated.language,
        });
      },
    });
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm" aria-busy="true">
        <div className="space-y-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
              <div className="h-10 w-full animate-pulse rounded-lg bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <p role="alert" className="text-sm text-red-600">
        {error.message}
      </p>
    );
  }

  const fieldClass =
    'block w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 aria-[invalid]:border-red-400';

  return (
    <SettingsSectionCard title="Preferences">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {mutation.isError && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {mutation.error.message}
          </div>
        )}

        {mutation.isSuccess && (
          <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Preferences saved.
          </div>
        )}

        {/* Send currency */}
        <div>
          <label htmlFor="preferredSendCurrency" className="mb-1.5 block text-sm font-medium text-gray-700">
            Default send currency
          </label>
          <select
            id="preferredSendCurrency"
            {...register('preferredSendCurrency')}
            aria-invalid={errors.preferredSendCurrency ? 'true' : undefined}
            className={fieldClass}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
          {errors.preferredSendCurrency && (
            <p role="alert" className="mt-1 text-xs text-red-600">{errors.preferredSendCurrency.message}</p>
          )}
        </div>

        {/* Receive country */}
        <div>
          <label htmlFor="preferredReceiveCountry" className="mb-1.5 block text-sm font-medium text-gray-700">
            Default receive country
          </label>
          <select
            id="preferredReceiveCountry"
            {...register('preferredReceiveCountry')}
            aria-invalid={errors.preferredReceiveCountry ? 'true' : undefined}
            className={fieldClass}
          >
            {RECEIVE_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
          {errors.preferredReceiveCountry && (
            <p role="alert" className="mt-1 text-xs text-red-600">{errors.preferredReceiveCountry.message}</p>
          )}
        </div>

        {/* Display currency */}
        <div>
          <label htmlFor="displayCurrency" className="mb-1.5 block text-sm font-medium text-gray-700">
            Display currency
          </label>
          <select
            id="displayCurrency"
            {...register('displayCurrency')}
            aria-invalid={errors.displayCurrency ? 'true' : undefined}
            className={fieldClass}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
          {errors.displayCurrency && (
            <p role="alert" className="mt-1 text-xs text-red-600">{errors.displayCurrency.message}</p>
          )}
        </div>

        {/* Language */}
        <div>
          <label htmlFor="language" className="mb-1.5 block text-sm font-medium text-gray-700">
            Language
          </label>
          <select
            id="language"
            {...register('language')}
            aria-invalid={errors.language ? 'true' : undefined}
            className={fieldClass}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
          {errors.language && (
            <p role="alert" className="mt-1 text-xs text-red-600">{errors.language.message}</p>
          )}
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={!isDirty || mutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mutation.isPending && (
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            Save preferences
          </button>
        </div>
      </form>
    </SettingsSectionCard>
  );
}
