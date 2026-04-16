'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { NotificationChannel } from '@/types/rate-alert';
import { useCreateRateAlertMutation } from '@/hooks/rateAlerts';

// ─── Schema ───────────────────────────────────────────────────────────────────

const rateAlertSchema = z.object({
  fromCurrency: z.string().min(3, 'Select a send currency'),
  toCurrency: z.string().min(3, 'Select a receive currency'),
  targetRate: z
    .string()
    .min(1, 'Enter a target rate')
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Must be a positive number'),
  notifyVia: z.array(z.enum(['email', 'push', 'sms', 'in_app'])).min(1, 'Choose at least one channel'),
});

type RateAlertFormValues = z.infer<typeof rateAlertSchema>;

// ─── Static data ──────────────────────────────────────────────────────────────

const CURRENCIES = [
  { code: 'GBP', label: 'British Pound' },
  { code: 'EUR', label: 'Euro' },
  { code: 'USD', label: 'US Dollar' },
  { code: 'AUD', label: 'Australian Dollar' },
  { code: 'CAD', label: 'Canadian Dollar' },
  { code: 'NGN', label: 'Nigerian Naira' },
  { code: 'GHS', label: 'Ghanaian Cedi' },
  { code: 'KES', label: 'Kenyan Shilling' },
  { code: 'INR', label: 'Indian Rupee' },
  { code: 'PHP', label: 'Philippine Peso' },
  { code: 'PKR', label: 'Pakistani Rupee' },
  { code: 'BDT', label: 'Bangladeshi Taka' },
  { code: 'CNY', label: 'Chinese Yuan' },
  { code: 'MXN', label: 'Mexican Peso' },
];

const CHANNELS: { value: NotificationChannel; label: string }[] = [
  { value: 'email', label: 'Email' },
  { value: 'push', label: 'Push notification' },
  { value: 'sms', label: 'SMS' },
  { value: 'in_app', label: 'In-app' },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface RateAlertFormProps {
  onSuccess?: () => void;
}

export function RateAlertForm({ onSuccess }: RateAlertFormProps) {
  const createMutation = useCreateRateAlertMutation();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RateAlertFormValues>({
    resolver: zodResolver(rateAlertSchema),
    defaultValues: {
      fromCurrency: 'GBP',
      toCurrency: '',
      targetRate: '',
      notifyVia: ['email'],
    },
  });

  const isPending = isSubmitting || createMutation.isPending;

  function onSubmit(values: RateAlertFormValues) {
    createMutation.mutate(
      {
        fromCurrency: values.fromCurrency,
        toCurrency: values.toCurrency,
        targetRate: Number(values.targetRate),
        notifyVia: values.notifyVia,
      },
      {
        onSuccess: () => {
          reset();
          onSuccess?.();
        },
      },
    );
  }

  return (
    <section
      aria-labelledby="create-alert-heading"
      className="rounded-2xl border bg-white p-6 shadow-sm"
    >
      <h2 id="create-alert-heading" className="text-base font-semibold text-gray-900">
        Create a new alert
      </h2>

      {createMutation.isError && (
        <div role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {createMutation.error.message || 'Failed to create alert. Please try again.'}
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="mt-4 space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {/* From currency */}
          <div className="space-y-1">
            <label htmlFor="fromCurrency" className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Send currency
            </label>
            <select
              id="fromCurrency"
              {...register('fromCurrency')}
              aria-invalid={!!errors.fromCurrency}
              aria-describedby={errors.fromCurrency ? 'fromCurrency-error' : undefined}
              className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 aria-invalid:border-red-400"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.label}
                </option>
              ))}
            </select>
            {errors.fromCurrency && (
              <p id="fromCurrency-error" role="alert" className="text-xs text-red-600">
                {errors.fromCurrency.message}
              </p>
            )}
          </div>

          {/* To currency */}
          <div className="space-y-1">
            <label htmlFor="toCurrency" className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Receive currency
            </label>
            <select
              id="toCurrency"
              {...register('toCurrency')}
              aria-invalid={!!errors.toCurrency}
              aria-describedby={errors.toCurrency ? 'toCurrency-error' : undefined}
              className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 aria-invalid:border-red-400"
            >
              <option value="">Select currency…</option>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.label}
                </option>
              ))}
            </select>
            {errors.toCurrency && (
              <p id="toCurrency-error" role="alert" className="text-xs text-red-600">
                {errors.toCurrency.message}
              </p>
            )}
          </div>

          {/* Target rate */}
          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="targetRate" className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
              Target rate
            </label>
            <input
              id="targetRate"
              type="number"
              step="any"
              min="0"
              inputMode="decimal"
              placeholder="e.g. 1700.00"
              {...register('targetRate')}
              aria-invalid={!!errors.targetRate}
              aria-describedby={errors.targetRate ? 'targetRate-error' : 'targetRate-hint'}
              className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 aria-invalid:border-red-400"
            />
            <p id="targetRate-hint" className="text-xs text-gray-400">
              We&apos;ll notify you when the live rate reaches or exceeds this value.
            </p>
            {errors.targetRate && (
              <p id="targetRate-error" role="alert" className="text-xs text-red-600">
                {errors.targetRate.message}
              </p>
            )}
          </div>
        </div>

        {/* Notification channels */}
        <fieldset>
          <legend className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Notify me via
          </legend>
          <div className="mt-2 flex flex-wrap gap-3">
            <Controller
              name="notifyVia"
              control={control}
              render={({ field }) => (
                <>
                  {CHANNELS.map((ch) => {
                    const checked = field.value.includes(ch.value);
                    return (
                      <label
                        key={ch.value}
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition select-none ${
                          checked
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:bg-blue-50/50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={() => {
                            const next = checked
                              ? field.value.filter((v) => v !== ch.value)
                              : [...field.value, ch.value];
                            field.onChange(next);
                          }}
                        />
                        {checked && (
                          <svg className="h-3.5 w-3.5 text-blue-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        {ch.label}
                      </label>
                    );
                  })}
                </>
              )}
            />
          </div>
          {errors.notifyVia && (
            <p role="alert" className="mt-1 text-xs text-red-600">
              {errors.notifyVia.message}
            </p>
          )}
        </fieldset>

        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating alert…
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Create alert
            </>
          )}
        </button>
      </form>
    </section>
  );
}
