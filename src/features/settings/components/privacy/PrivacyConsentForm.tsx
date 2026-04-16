'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { usePrivacyQuery } from '@/features/settings/hooks/usePrivacyQuery';
import { useUpdatePrivacyMutation } from '@/features/settings/hooks/useUpdatePrivacyMutation';
import type { UpdatePrivacyPayload } from '@/types/settings';
import { SettingsSectionCard } from '../SettingsSectionCard';

type FormValues = UpdatePrivacyPayload;

const CONSENT_ITEMS: {
  key: keyof UpdatePrivacyPayload;
  label: string;
  description: string;
  required?: boolean;
}[] = [
  {
    key: 'marketingOptIn',
    label: 'Marketing communications',
    description:
      'Receive personalised offers, promotions, and money-saving tips by email and push notification.',
  },
  {
    key: 'analyticsConsent',
    label: 'Anonymised analytics',
    description:
      'Help us improve Send2 by sharing anonymised usage data. No personally identifiable information is collected.',
  },
  {
    key: 'thirdPartySharing',
    label: 'Third-party comparison partners',
    description:
      'Share your search preferences with partner comparison sites to receive personalised rate recommendations.',
  },
];

function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-blue-600' : 'bg-gray-200'
      }`}
    >
      <span className="sr-only">{label}</span>
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export function PrivacyConsentForm() {
  const { data: privacy, isLoading, isError, error } = usePrivacyQuery();
  const mutation = useUpdatePrivacyMutation();

  const { control, handleSubmit, reset, formState: { isDirty } } =
    useForm<FormValues>();

  useEffect(() => {
    if (privacy) {
      reset({
        marketingOptIn: privacy.marketingOptIn,
        analyticsConsent: privacy.analyticsConsent,
        thirdPartySharing: privacy.thirdPartySharing,
      });
    }
  }, [privacy, reset]);

  function onSubmit(values: FormValues) {
    mutation.mutate(values, {
      onSuccess: (updated) => {
        reset({
          marketingOptIn: updated.marketingOptIn,
          analyticsConsent: updated.analyticsConsent,
          thirdPartySharing: updated.thirdPartySharing,
        });
      },
    });
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm" aria-busy="true">
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-44 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-full max-w-sm animate-pulse rounded bg-gray-200" />
              </div>
              <div className="h-6 w-11 shrink-0 animate-pulse rounded-full bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return <p role="alert" className="text-sm text-red-600">{error.message}</p>;
  }

  return (
    <SettingsSectionCard
      title="Privacy &amp; Consent"
      description="You can update your consent preferences at any time. Changes take effect immediately."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        {mutation.isError && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {mutation.error.message}
          </div>
        )}

        {mutation.isSuccess && (
          <div role="status" className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Consent preferences updated.
          </div>
        )}

        {CONSENT_ITEMS.map((item) => (
          <div key={item.key} className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{item.label}</p>
              <p className="mt-0.5 text-sm text-gray-500">{item.description}</p>
            </div>
            <Controller
              control={control}
              name={item.key}
              render={({ field }) => (
                <Toggle
                  checked={field.value as boolean}
                  onChange={field.onChange}
                  label={item.label}
                  disabled={mutation.isPending}
                />
              )}
            />
          </div>
        ))}

        {/* Legal notice */}
        <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500">
          Your personal data is processed in accordance with our{' '}
          <a
            href="/privacy-policy"
            className="underline hover:text-gray-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 rounded"
          >
            Privacy Policy
          </a>
          . We comply with GDPR and will never sell your personal data to third
          parties. Last updated:{' '}
          {privacy?.lastUpdatedAt
            ? new Date(privacy.lastUpdatedAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : '—'}
          .
        </div>

        <div className="flex justify-end">
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
