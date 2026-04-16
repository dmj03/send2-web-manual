'use client';

import { useState, useId } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { AmountAnswer } from '../types';

const CURRENCIES = [
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
];

const amountSchema = z.object({
  sendAmount: z
    .number({ error: 'Please enter a valid amount' })
    .min(1, 'Amount must be at least 1')
    .max(1_000_000, 'Amount cannot exceed 1,000,000'),
  sendCurrency: z.string().min(3).max(3),
});

type AmountFormValues = z.infer<typeof amountSchema>;

interface QuizAmountStepProps {
  initial: AmountAnswer | null;
  onAnswer: (answer: AmountAnswer) => void;
}

export function QuizAmountStep({ initial, onAnswer }: QuizAmountStepProps) {
  const amountInputId = useId();
  const currencySelectId = useId();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AmountFormValues>({
    resolver: zodResolver(amountSchema),
    defaultValues: {
      sendAmount: initial?.sendAmount ?? 500,
      sendCurrency: initial?.sendCurrency ?? 'GBP',
    },
  });

  const selectedCurrency = watch('sendCurrency');
  const currencySymbol =
    CURRENCIES.find((c) => c.code === selectedCurrency)?.symbol ?? '';

  const QUICK_AMOUNTS = [100, 250, 500, 1000, 2500];

  function onSubmit(values: AmountFormValues) {
    onAnswer(values);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      {/* Currency selector */}
      <div>
        <label
          htmlFor={currencySelectId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Send currency
        </label>
        <select
          id={currencySelectId}
          {...register('sendCurrency')}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} — {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* Amount input */}
      <div>
        <label
          htmlFor={amountInputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Amount to send
        </label>
        <div className="relative rounded-lg shadow-sm">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-gray-500 text-lg font-semibold">{currencySymbol}</span>
          </div>
          <input
            id={amountInputId}
            type="number"
            inputMode="decimal"
            min={1}
            step={1}
            {...register('sendAmount', { valueAsNumber: true })}
            className={[
              'block w-full rounded-lg border py-3 pl-10 pr-4 text-lg font-semibold',
              'focus:outline-none focus:ring-2 focus:ring-blue-500',
              errors.sendAmount
                ? 'border-red-400 focus:ring-red-400'
                : 'border-gray-300 focus:border-blue-500',
            ].join(' ')}
            aria-describedby={errors.sendAmount ? `${amountInputId}-error` : undefined}
            aria-invalid={!!errors.sendAmount}
          />
        </div>
        {errors.sendAmount && (
          <p
            id={`${amountInputId}-error`}
            role="alert"
            className="mt-1 text-sm text-red-600"
          >
            {errors.sendAmount.message}
          </p>
        )}
      </div>

      {/* Quick-select amounts */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">Quick amounts</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => setValue('sendAmount', amt, { shouldValidate: true })}
              className="rounded-full border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              {currencySymbol}
              {amt.toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        type="submit"
        className="w-full rounded-xl bg-blue-600 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        Continue
      </button>
    </form>
  );
}
