'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTwoFactorQuery } from '@/features/settings/hooks/useTwoFactorQuery';
import {
  useTwoFactorSetupMutation,
  useTwoFactorEnableMutation,
  useTwoFactorDisableMutation,
} from '@/features/settings/hooks/useTwoFactorMutation';
import { SettingsSectionCard } from '../SettingsSectionCard';

type Step = 'idle' | 'setup' | 'confirm' | 'disable';

const confirmSchema = z.object({
  totpCode: z.string().length(6, 'Enter the 6-digit code from your authenticator app'),
});

const disableSchema = z.object({
  currentPassword: z.string().min(1, 'Password is required'),
  totpCode: z.string().length(6, 'Enter the 6-digit code').optional().or(z.literal('')),
});

type ConfirmValues = z.infer<typeof confirmSchema>;
type DisableValues = z.infer<typeof disableSchema>;

export function TwoFactorToggle() {
  const { data: status, isLoading } = useTwoFactorQuery();
  const [step, setStep] = useState<Step>('idle');

  const setupMutation = useTwoFactorSetupMutation();
  const enableMutation = useTwoFactorEnableMutation();
  const disableMutation = useTwoFactorDisableMutation();

  const confirmForm = useForm<ConfirmValues>({
    resolver: zodResolver(confirmSchema),
  });

  const disableForm = useForm<DisableValues>({
    resolver: zodResolver(disableSchema),
  });

  function handleToggleOn() {
    setStep('setup');
    setupMutation.mutate(undefined, {
      onSuccess: () => setStep('confirm'),
      onError: () => setStep('idle'),
    });
  }

  function handleToggleOff() {
    setStep('disable');
  }

  async function handleConfirmEnable(values: ConfirmValues) {
    enableMutation.mutate(values, {
      onSuccess: () => {
        setStep('idle');
        confirmForm.reset();
      },
    });
  }

  async function handleConfirmDisable(values: DisableValues) {
    const payload = {
      currentPassword: values.currentPassword,
      ...(values.totpCode ? { totpCode: values.totpCode } : {}),
    };
    disableMutation.mutate(payload, {
      onSuccess: () => {
        setStep('idle');
        disableForm.reset();
      },
    });
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-4 w-44 animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-64 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="h-6 w-11 animate-pulse rounded-full bg-gray-200" />
        </div>
      </div>
    );
  }

  const is2faEnabled = status?.enabled ?? false;

  return (
    <SettingsSectionCard
      title="Two-factor authentication"
      description="Add an extra layer of security to your account with a TOTP authenticator app."
    >
      <div className="space-y-5">
        {/* Toggle row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {is2faEnabled ? '2FA is enabled' : '2FA is disabled'}
            </p>
            {status?.enabledAt && (
              <p className="mt-0.5 text-xs text-gray-500">
                Enabled on{' '}
                {new Date(status.enabledAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={is2faEnabled}
            onClick={is2faEnabled ? handleToggleOff : handleToggleOn}
            disabled={setupMutation.isPending || step === 'setup'}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
              is2faEnabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span className="sr-only">
              {is2faEnabled ? 'Disable 2FA' : 'Enable 2FA'}
            </span>
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
                is2faEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Setup loading */}
        {step === 'setup' && setupMutation.isPending && (
          <p className="text-sm text-gray-500">Setting up 2FA…</p>
        )}

        {/* Setup error */}
        {setupMutation.isError && (
          <p role="alert" className="text-sm text-red-600">
            {setupMutation.error.message}
          </p>
        )}

        {/* QR + confirm step */}
        {step === 'confirm' && setupMutation.data?.otpAuthUrl && (
          <div className="space-y-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
            <div>
              <p className="mb-2 text-sm font-medium text-gray-900">
                Scan this QR code with your authenticator app
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=${encodeURIComponent(setupMutation.data.otpAuthUrl)}`}
                alt="2FA QR code"
                width={200}
                height={200}
                className="rounded-md"
              />
            </div>

            {setupMutation.data.backupCodes && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Backup codes — save these now
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {setupMutation.data.backupCodes.map((code) => (
                    <code
                      key={code}
                      className="rounded bg-white px-2 py-1 text-xs font-mono text-gray-700 shadow-sm"
                    >
                      {code}
                    </code>
                  ))}
                </div>
              </div>
            )}

            <form
              onSubmit={confirmForm.handleSubmit(handleConfirmEnable)}
              className="flex gap-3"
            >
              <div className="flex-1">
                <label
                  htmlFor="totpCode"
                  className="mb-1.5 block text-xs font-medium text-gray-700"
                >
                  Enter the 6-digit code to confirm
                </label>
                <input
                  id="totpCode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  {...confirmForm.register('totpCode')}
                  aria-invalid={
                    confirmForm.formState.errors.totpCode ? 'true' : undefined
                  }
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono tracking-widest shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 aria-[invalid]:border-red-400"
                  placeholder="000000"
                />
                {confirmForm.formState.errors.totpCode && (
                  <p role="alert" className="mt-1 text-xs text-red-600">
                    {confirmForm.formState.errors.totpCode.message}
                  </p>
                )}
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  disabled={enableMutation.isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setStep('idle')}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>

            {enableMutation.isError && (
              <p role="alert" className="text-sm text-red-600">
                {enableMutation.error.message}
              </p>
            )}
          </div>
        )}

        {/* Disable confirm step */}
        {step === 'disable' && (
          <div className="space-y-4 rounded-lg border border-red-100 bg-red-50 p-4">
            <p className="text-sm font-medium text-gray-900">
              Enter your password to disable 2FA
            </p>
            <form
              onSubmit={disableForm.handleSubmit(handleConfirmDisable)}
              className="space-y-3"
            >
              <div>
                <label
                  htmlFor="disable2faPassword"
                  className="mb-1.5 block text-xs font-medium text-gray-700"
                >
                  Current password
                </label>
                <input
                  id="disable2faPassword"
                  type="password"
                  autoComplete="current-password"
                  {...disableForm.register('currentPassword')}
                  aria-invalid={
                    disableForm.formState.errors.currentPassword
                      ? 'true'
                      : undefined
                  }
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 aria-[invalid]:border-red-400"
                />
                {disableForm.formState.errors.currentPassword && (
                  <p role="alert" className="mt-1 text-xs text-red-600">
                    {disableForm.formState.errors.currentPassword.message}
                  </p>
                )}
              </div>

              {disableMutation.isError && (
                <p role="alert" className="text-sm text-red-600">
                  {disableMutation.error.message}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={disableMutation.isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {disableMutation.isPending ? 'Disabling…' : 'Disable 2FA'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('idle')}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </SettingsSectionCard>
  );
}
