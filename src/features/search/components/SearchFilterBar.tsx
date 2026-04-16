'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { buildSearchUrl } from '@/lib/navigation';
import type { ActiveFilters } from '@/features/search/hooks';
import type { TransferMethod } from '@/types/provider';

const CURRENCIES = [
  { code: 'GBP', flag: '🇬🇧' },
  { code: 'EUR', flag: '🇪🇺' },
  { code: 'USD', flag: '🇺🇸' },
  { code: 'AUD', flag: '🇦🇺' },
  { code: 'CAD', flag: '🇨🇦' },
  { code: 'SGD', flag: '🇸🇬' },
];

const DESTINATIONS = [
  { code: 'IN', label: 'India', flag: '🇮🇳', currency: 'INR' },
  { code: 'NG', label: 'Nigeria', flag: '🇳🇬', currency: 'NGN' },
  { code: 'PH', label: 'Philippines', flag: '🇵🇭', currency: 'PHP' },
  { code: 'PK', label: 'Pakistan', flag: '🇵🇰', currency: 'PKR' },
  { code: 'MX', label: 'Mexico', flag: '🇲🇽', currency: 'MXN' },
  { code: 'GH', label: 'Ghana', flag: '🇬🇭', currency: 'GHS' },
  { code: 'KE', label: 'Kenya', flag: '🇰🇪', currency: 'KES' },
  { code: 'ZA', label: 'South Africa', flag: '🇿🇦', currency: 'ZAR' },
  { code: 'BD', label: 'Bangladesh', flag: '🇧🇩', currency: 'BDT' },
  { code: 'US', label: 'United States', flag: '🇺🇸', currency: 'USD' },
  { code: 'CN', label: 'China', flag: '🇨🇳', currency: 'CNY' },
];

const TRANSFER_METHODS: { value: TransferMethod; label: string }[] = [
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'mobile_money', label: 'Mobile money' },
  { value: 'cash_pickup', label: 'Cash pickup' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'debit_card', label: 'Debit card' },
];

const filterSchema = z.object({
  sendAmount: z
    .string()
    .min(1, 'Required')
    .refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Invalid amount'),
  sendCurrency: z.string().min(1),
  receiveCountry: z.string().min(2, 'Required'),
  transferMethod: z.string().optional(),
  maxFee: z.string().optional(),
  minRating: z.string().optional(),
});

type FilterFormValues = z.infer<typeof filterSchema>;

interface SearchFilterBarProps {
  filters: ActiveFilters | null;
}

export function SearchFilterBar({ filters }: SearchFilterBarProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isDirty },
  } = useForm<FilterFormValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      sendAmount: filters ? String(filters.sendAmount) : '500',
      sendCurrency: filters?.sendCurrency ?? 'GBP',
      receiveCountry: filters?.receiveCountry ?? '',
      transferMethod: filters?.transferMethod ?? '',
      maxFee: filters?.maxFee !== undefined ? String(filters.maxFee) : '',
      minRating: filters?.minRating !== undefined ? String(filters.minRating) : '',
    },
  });

  const selectedCountry = watch('receiveCountry');
  const destination = DESTINATIONS.find((d) => d.code === selectedCountry);

  const onSubmit = (values: FilterFormValues) => {
    const receiveCurrency = destination?.currency ?? filters?.receiveCurrency ?? 'USD';
    const url = buildSearchUrl({
      fromCurrency: values.sendCurrency,
      toCurrency: receiveCurrency,
      amount: values.sendAmount,
      toCountry: values.receiveCountry,
    });

    const params = new URLSearchParams(url.split('?')[1] ?? '');
    if (values.transferMethod) params.set('method', values.transferMethod);
    if (values.maxFee) params.set('maxFee', values.maxFee);
    if (values.minRating) params.set('minRating', values.minRating);

    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="sticky top-0 z-20 border-b border-gray-200 bg-white shadow-sm">
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        aria-label="Refine search"
      >
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="flex flex-wrap items-end gap-3">
            {/* Amount */}
            <div className="min-w-[100px] flex-1">
              <label htmlFor="filter-amount" className="sr-only">
                Send amount
              </label>
              <input
                id="filter-amount"
                type="number"
                min="1"
                step="any"
                inputMode="decimal"
                {...register('sendAmount')}
                aria-invalid={!!errors.sendAmount}
                placeholder="Amount"
                className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 aria-invalid:border-red-400"
              />
            </div>

            {/* Send currency */}
            <div className="min-w-[90px]">
              <label htmlFor="filter-from" className="sr-only">
                From currency
              </label>
              <Controller
                name="sendCurrency"
                control={control}
                render={({ field }) => (
                  <select
                    id="filter-from"
                    {...field}
                    className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>

            {/* Destination */}
            <div className="min-w-[140px] flex-1">
              <label htmlFor="filter-to" className="sr-only">
                To country
              </label>
              <Controller
                name="receiveCountry"
                control={control}
                render={({ field }) => (
                  <select
                    id="filter-to"
                    {...field}
                    aria-invalid={!!errors.receiveCountry}
                    className="block w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 aria-invalid:border-red-400"
                  >
                    <option value="">Destination…</option>
                    {DESTINATIONS.map((d) => (
                      <option key={d.code} value={d.code}>
                        {d.flag} {d.label}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>

            {/* More filters toggle */}
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              {expanded ? '▲ Fewer' : '▼ More filters'}
            </button>

            <button
              type="submit"
              disabled={!isDirty}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              Update
            </button>
          </div>

          {/* Expanded filters */}
          {expanded && (
            <div className="mt-3 flex flex-wrap gap-3 border-t border-gray-100 pt-3">
              {/* Transfer method */}
              <div>
                <label
                  htmlFor="filter-method"
                  className="mb-1 block text-xs font-medium text-gray-500"
                >
                  Transfer method
                </label>
                <Controller
                  name="transferMethod"
                  control={control}
                  render={({ field }) => (
                    <select
                      id="filter-method"
                      {...field}
                      className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="">Any method</option>
                      {TRANSFER_METHODS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </div>

              {/* Max fee */}
              <div>
                <label
                  htmlFor="filter-maxfee"
                  className="mb-1 block text-xs font-medium text-gray-500"
                >
                  Max fee
                </label>
                <input
                  id="filter-maxfee"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register('maxFee')}
                  placeholder="e.g. 5"
                  className="w-24 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Min rating */}
              <div>
                <label
                  htmlFor="filter-rating"
                  className="mb-1 block text-xs font-medium text-gray-500"
                >
                  Min rating
                </label>
                <input
                  id="filter-rating"
                  type="number"
                  min="0"
                  max="5"
                  step="0.5"
                  {...register('minRating')}
                  placeholder="e.g. 4"
                  className="w-20 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
