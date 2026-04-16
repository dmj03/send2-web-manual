'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { apiClient, ApiClientError } from '@/lib/api/client';
import type { Route } from 'next';
import { ROUTES } from '@/lib/navigation';
import type { ApiResponse } from '@/types/api';

const reactivateSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
});

type ReactivateFormValues = z.infer<typeof reactivateSchema>;

interface ReactivateResponse {
  message: string;
}

function useReactivateMutation() {
  return useMutation<ReactivateResponse, ApiClientError, ReactivateFormValues>({
    mutationFn: async (payload) => {
      const res = await apiClient.post<ApiResponse<ReactivateResponse>>(
        '/auth/reactivate',
        payload,
      );
      return res.data;
    },
  });
}

export function ReactivateForm() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReactivateFormValues>({
    resolver: zodResolver(reactivateSchema),
  });

  const { mutate: reactivate, isPending, error } = useReactivateMutation();

  const onSubmit = ({ email }: ReactivateFormValues) => {
    reactivate(
      { email },
      { onSuccess: () => setSubmittedEmail(email) },
    );
  };

  if (submittedEmail) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
          <svg className="h-7 w-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reactivation requested</h1>
          <p className="mt-2 text-sm text-gray-500">
            We&apos;ve sent instructions to{' '}
            <span className="font-medium text-gray-700">{submittedEmail}</span>.
            Follow the link in the email to reactivate your account.
          </p>
        </div>
        <Link
          href={ROUTES.auth.login as Route}
          className="block text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
        >
          Return to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reactivate account</h1>
        <p className="mt-1 text-sm text-gray-500">
          Your account may have been deactivated. Enter your email address and
          we&apos;ll send you reactivation instructions.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200"
        >
          {error.message ?? 'Something went wrong. Please try again.'}
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="reactivate-email" className="block text-sm font-medium text-gray-700">
          Email address
        </label>
        <input
          id="reactivate-email"
          type="email"
          autoComplete="email"
          autoFocus
          {...register('email')}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'reactivate-email-error' : undefined}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 aria-invalid:border-red-400"
          placeholder="you@example.com"
        />
        {errors.email && (
          <p id="reactivate-email-error" role="alert" className="text-xs text-red-600">
            {errors.email.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <>
            <svg className="-ml-1 mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Sending…
          </>
        ) : (
          'Request reactivation'
        )}
      </button>

      <Link
        href={ROUTES.auth.login as Route}
        className="block text-center text-sm font-medium text-gray-500 hover:text-gray-700"
      >
        ← Back to sign in
      </Link>
    </form>
  );
}
