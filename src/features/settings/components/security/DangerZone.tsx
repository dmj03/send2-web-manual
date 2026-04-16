'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDeactivateAccountMutation } from '@/features/settings/hooks/useDeactivateAccountMutation';

const schema = z.object({
  password: z.string().min(1, 'Password is required'),
  confirm: z.string(),
}).refine((d) => d.confirm === 'DELETE', {
  message: 'Type DELETE to confirm',
  path: ['confirm'],
});

type FormValues = z.infer<typeof schema>;

export function DangerZone() {
  const [showConfirm, setShowConfirm] = useState(false);
  const mutation = useDeactivateAccountMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    mutation.mutate({ password: values.password });
  }

  return (
    <section
      className="rounded-xl border border-red-200 bg-white shadow-sm"
      aria-labelledby="danger-zone-heading"
    >
      <div className="border-b border-red-100 px-6 py-4">
        <h2
          id="danger-zone-heading"
          className="text-base font-semibold text-red-700"
        >
          Danger zone
        </h2>
        <p className="mt-0.5 text-sm text-gray-500">
          Irreversible and destructive actions.
        </p>
      </div>

      <div className="px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Deactivate account
            </p>
            <p className="mt-0.5 text-sm text-gray-500">
              Your data will be retained for 30 days before permanent deletion.
              You can reactivate by logging in during that period.
            </p>
          </div>
          {!showConfirm && (
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="shrink-0 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            >
              Deactivate
            </button>
          )}
        </div>

        {showConfirm && (
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="mt-5 space-y-4 rounded-lg border border-red-200 bg-red-50 p-4"
          >
            <p className="text-sm font-medium text-gray-900">
              Are you sure? This will deactivate your account.
            </p>

            {mutation.isError && (
              <p role="alert" className="text-sm text-red-700">
                {mutation.error.message}
              </p>
            )}

            <div>
              <label
                htmlFor="deactivatePassword"
                className="mb-1.5 block text-xs font-medium text-gray-700"
              >
                Enter your password
              </label>
              <input
                id="deactivatePassword"
                type="password"
                autoComplete="current-password"
                {...register('password')}
                aria-invalid={errors.password ? 'true' : undefined}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 aria-[invalid]:border-red-400"
              />
              {errors.password && (
                <p role="alert" className="mt-1 text-xs text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="deactivateConfirm"
                className="mb-1.5 block text-xs font-medium text-gray-700"
              >
                Type <strong>DELETE</strong> to confirm
              </label>
              <input
                id="deactivateConfirm"
                type="text"
                {...register('confirm')}
                aria-invalid={errors.confirm ? 'true' : undefined}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 aria-[invalid]:border-red-400"
                placeholder="DELETE"
              />
              {errors.confirm && (
                <p role="alert" className="mt-1 text-xs text-red-600">
                  {errors.confirm.message}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={mutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {mutation.isPending ? 'Deactivating…' : 'Deactivate my account'}
              </button>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
