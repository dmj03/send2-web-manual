'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { buildSearchUrl } from '@/lib/navigation';
import { useSearchStore } from '@/stores/searchStore';

// ─── Schema ───────────────────────────────────────────────────────────────────

const heroSchema = z.object({
  sendAmount: z
    .string()
    .min(1, 'Enter an amount')
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Enter a valid amount'),
  sendCurrency: z.string().min(3, 'Select a send currency'),
  receiveCountry: z.string().min(2, 'Select a destination'),
});

type HeroFormValues = z.infer<typeof heroSchema>;

// ─── Static data ──────────────────────────────────────────────────────────────

const POPULAR_CURRENCIES: { code: string; label: string; flag: string }[] = [
  { code: 'GBP', label: 'British Pound', flag: '🇬🇧' },
  { code: 'EUR', label: 'Euro', flag: '🇪🇺' },
  { code: 'USD', label: 'US Dollar', flag: '🇺🇸' },
  { code: 'AUD', label: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'CAD', label: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'SGD', label: 'Singapore Dollar', flag: '🇸🇬' },
];

const POPULAR_DESTINATIONS: { code: string; label: string; flag: string; currency: string }[] = [
  { code: 'IN', label: 'India', flag: '🇮🇳', currency: 'INR' },
  { code: 'NG', label: 'Nigeria', flag: '🇳🇬', currency: 'NGN' },
  { code: 'PH', label: 'Philippines', flag: '🇵🇭', currency: 'PHP' },
  { code: 'PK', label: 'Pakistan', flag: '🇵🇰', currency: 'PKR' },
  { code: 'MX', label: 'Mexico', flag: '🇲🇽', currency: 'MXN' },
  { code: 'GH', label: 'Ghana', flag: '🇬🇭', currency: 'GHS' },
  { code: 'KE', label: 'Kenya', flag: '🇰🇪', currency: 'KES' },
  { code: 'ZA', label: 'South Africa', flag: '🇿🇦', currency: 'ZAR' },
  { code: 'BD', label: 'Bangladesh', flag: '🇧🇩', currency: 'BDT' },
  { code: 'CN', label: 'China', flag: '🇨🇳', currency: 'CNY' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function HeroSearchForm() {
  const router = useRouter();
  const setFilters = useSearchStore((s) => s.setFilters);
  const [isNavigating, setIsNavigating] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<HeroFormValues>({
    resolver: zodResolver(heroSchema),
    defaultValues: {
      sendAmount: '500',
      sendCurrency: 'GBP',
      receiveCountry: '',
    },
  });

  const selectedCountry = watch('receiveCountry');
  const destination = POPULAR_DESTINATIONS.find((d) => d.code === selectedCountry);

  const onSubmit = useCallback(
    (values: HeroFormValues) => {
      setIsNavigating(true);

      const receiveCurrency = destination?.currency ?? 'USD';

      setFilters({
        sendAmount: Number(values.sendAmount),
        sendCurrency: values.sendCurrency,
        receiveCurrency,
        receiveCountry: values.receiveCountry,
        corridor: `${values.sendCurrency}_${receiveCurrency}`,
      });

      const url = buildSearchUrl({
        fromCurrency: values.sendCurrency,
        toCurrency: receiveCurrency,
        amount: values.sendAmount,
        toCountry: values.receiveCountry,
      });

      router.push(url as Route);
    },
    [router, setFilters, destination],
  );

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Money transfer search"
      className="rounded-2xl bg-white p-6 shadow-2xl"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Amount */}
        <div className="space-y-1">
          <label htmlFor="sendAmount" className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
            You send
          </label>
          <input
            id="sendAmount"
            type="number"
            min="1"
            step="any"
            inputMode="decimal"
            {...register('sendAmount')}
            aria-describedby={errors.sendAmount ? 'amount-error' : undefined}
            aria-invalid={!!errors.sendAmount}
            className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-lg font-semibold text-gray-900 placeholder-gray-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 aria-invalid:border-red-400"
            placeholder="500"
          />
          {errors.sendAmount && (
            <p id="amount-error" role="alert" className="text-xs text-red-600">
              {errors.sendAmount.message}
            </p>
          )}
        </div>

        {/* Send currency */}
        <div className="space-y-1">
          <label htmlFor="sendCurrency" className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
            From currency
          </label>
          <Controller
            name="sendCurrency"
            control={control}
            render={({ field }) => (
              <select
                id="sendCurrency"
                {...field}
                aria-invalid={!!errors.sendCurrency}
                className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-base text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 aria-invalid:border-red-400"
              >
                {POPULAR_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} — {c.label}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.sendCurrency && (
            <p role="alert" className="text-xs text-red-600">
              {errors.sendCurrency.message}
            </p>
          )}
        </div>

        {/* Destination */}
        <div className="space-y-1">
          <label htmlFor="receiveCountry" className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
            To country
          </label>
          <Controller
            name="receiveCountry"
            control={control}
            render={({ field }) => (
              <select
                id="receiveCountry"
                {...field}
                aria-invalid={!!errors.receiveCountry}
                className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-base text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 aria-invalid:border-red-400"
              >
                <option value="">Select destination…</option>
                {POPULAR_DESTINATIONS.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.flag} {d.label} ({d.currency})
                  </option>
                ))}
              </select>
            )}
          />
          {errors.receiveCountry && (
            <p role="alert" className="text-xs text-red-600">
              {errors.receiveCountry.message}
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isNavigating}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-base font-bold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 sm:text-lg"
      >
        {isNavigating ? (
          <>
            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Searching…
          </>
        ) : (
          <>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.65 16.65 7.5 7.5 0 0016.65 16.65z" />
            </svg>
            Compare rates
          </>
        )}
      </button>

      <p className="mt-3 text-center text-xs text-gray-400">
        Free to compare · No sign-up required · Live rates updated every minute
      </p>
    </form>
  );
}
