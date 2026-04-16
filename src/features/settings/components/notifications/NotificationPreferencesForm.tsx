'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNotificationPreferencesQuery } from '@/features/settings/hooks/useNotificationPreferencesQuery';
import { useUpdateNotificationPreferencesMutation } from '@/features/settings/hooks/useUpdateNotificationPreferencesMutation';
import type { NotificationPreferences } from '@/types/settings';

type FormValues = NotificationPreferences;

const CATEGORIES: {
  key: keyof NotificationPreferences;
  label: string;
  description: string;
}[] = [
  {
    key: 'rateAlerts',
    label: 'Rate Alerts',
    description: 'When your tracked exchange rate is reached.',
  },
  {
    key: 'transferUpdates',
    label: 'Transfer Updates',
    description: 'Status changes for money transfers.',
  },
  {
    key: 'promotions',
    label: 'Promotions',
    description: 'Exclusive offers and fee discounts.',
  },
  {
    key: 'news',
    label: 'News & Announcements',
    description: 'Product updates and currency market insights.',
  },
  {
    key: 'accountSecurity',
    label: 'Account Security',
    description: 'Login alerts and password changes.',
  },
  {
    key: 'weeklyDigest',
    label: 'Weekly Digest',
    description: 'A weekly summary of your saved rates.',
  },
];

const CHANNELS = ['email', 'push', 'sms'] as const;
type Channel = (typeof CHANNELS)[number];

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
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-blue-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export function NotificationPreferencesForm() {
  const { data: prefs, isLoading, isError, error } = useNotificationPreferencesQuery();
  const mutation = useUpdateNotificationPreferencesMutation();

  const { control, handleSubmit, reset, formState: { isDirty } } =
    useForm<FormValues>();

  useEffect(() => {
    if (prefs) reset(prefs);
  }, [prefs, reset]);

  function onSubmit(values: FormValues) {
    mutation.mutate(values, {
      onSuccess: (updated) => reset(updated),
    });
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm" aria-busy="true">
        <div className="grid grid-cols-4 gap-4 border-b border-gray-100 px-6 py-3">
          <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
          {CHANNELS.map((ch) => (
            <div key={ch} className="flex justify-center">
              <div className="h-4 w-10 animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>
        {CATEGORIES.map((cat) => (
          <div key={cat.key} className="grid grid-cols-4 items-center gap-4 border-b border-gray-50 px-6 py-4 last:border-0">
            <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
            {CHANNELS.map((_, i) => (
              <div key={i} className="flex justify-center">
                <div className="h-5 w-9 animate-pulse rounded-full bg-gray-200" />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return <p role="alert" className="text-sm text-red-600">{error.message}</p>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* Column headers */}
        <div className="grid grid-cols-4 items-center gap-4 border-b border-gray-200 bg-gray-50 px-6 py-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Notification
          </span>
          {CHANNELS.map((ch) => (
            <span
              key={ch}
              className="text-center text-xs font-semibold uppercase tracking-wider text-gray-500"
            >
              {ch.charAt(0).toUpperCase() + ch.slice(1)}
            </span>
          ))}
        </div>

        {/* Category rows */}
        {CATEGORIES.map((cat) => (
          <div
            key={cat.key}
            className="grid grid-cols-4 items-center gap-4 border-b border-gray-50 px-6 py-4 last:border-0"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">{cat.label}</p>
              <p className="text-xs text-gray-500">{cat.description}</p>
            </div>

            {CHANNELS.map((channel) => (
              <div key={channel} className="flex justify-center">
                <Controller
                  control={control}
                  name={`${cat.key}.${channel}` as `${typeof cat.key}.${Channel}`}
                  render={({ field }) => (
                    <Toggle
                      checked={field.value as boolean}
                      onChange={field.onChange}
                      label={`${cat.label} via ${channel}`}
                      disabled={mutation.isPending}
                    />
                  )}
                />
              </div>
            ))}
          </div>
        ))}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
          <div>
            {mutation.isError && (
              <p role="alert" className="text-sm text-red-600">
                {mutation.error.message}
              </p>
            )}
            {mutation.isSuccess && (
              <p role="status" className="text-sm text-green-600">
                Notification preferences saved.
              </p>
            )}
          </div>
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
      </div>
    </form>
  );
}
