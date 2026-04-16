'use client';

import { useRef, useState, KeyboardEvent, ClipboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { useOtpVerifyMutation } from '@/features/auth/hooks/useOtpVerifyMutation';
import { useResendOtpMutation } from '@/features/auth/hooks/useResendOtpMutation';
import { ROUTES } from '@/lib/navigation';

const OTP_LENGTH = 6;

interface OtpFormProps {
  email: string;
  /** Where to redirect after successful verification. Defaults to profile dashboard. */
  onSuccess?: () => void;
}

export function OtpForm({ email, onSuccess }: OtpFormProps) {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { mutate: verifyOtp, isPending, error } = useOtpVerifyMutation();
  const { mutate: resendOtp, isPending: isResending } = useResendOtpMutation();

  const otp = digits.join('');
  const isComplete = otp.length === OTP_LENGTH;

  const focusNext = (index: number) => {
    inputRefs.current[index + 1]?.focus();
  };

  const focusPrev = (index: number) => {
    inputRefs.current[index - 1]?.focus();
  };

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit) focusNext(index);
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index]) {
      focusPrev(index);
    }
    if (e.key === 'ArrowLeft') focusPrev(index);
    if (e.key === 'ArrowRight') focusNext(index);
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = [...digits];
    pasted.split('').forEach((char, i) => {
      next[i] = char;
    });
    setDigits(next);
    // Focus the last filled cell (or last cell)
    const lastIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete || isPending) return;
    verifyOtp(
      { email, otp },
      {
        onSuccess: () => {
          if (onSuccess) {
            onSuccess();
          } else {
            router.push(ROUTES.profile.dashboard as Route);
          }
        },
      },
    );
  };

  const handleResend = () => {
    resendOtp(
      { email },
      {
        onSuccess: () => {
          setDigits(Array(OTP_LENGTH).fill(''));
          inputRefs.current[0]?.focus();
          // 60-second cooldown
          setResendCooldown(60);
          const timer = setInterval(() => {
            setResendCooldown((prev) => {
              if (prev <= 1) {
                clearInterval(timer);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Enter verification code</h1>
        <p className="mt-1 text-sm text-gray-500">
          We sent a 6-digit code to{' '}
          <span className="font-medium text-gray-700">{email}</span>.
          Enter it below to verify your account.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200"
        >
          {error.message ?? 'Invalid code. Please try again.'}
        </div>
      )}

      {/* OTP digit inputs */}
      <div
        role="group"
        aria-label="One-time password"
        className="flex justify-center gap-2"
      >
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            id={`otp-${index}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            autoFocus={index === 0}
            aria-label={`Digit ${index + 1}`}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className="h-12 w-10 rounded-lg border border-gray-300 text-center text-lg font-semibold text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 sm:h-14 sm:w-12"
          />
        ))}
      </div>

      <button
        type="submit"
        disabled={!isComplete || isPending}
        className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <>
            <svg className="-ml-1 mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Verifying…
          </>
        ) : (
          'Verify code'
        )}
      </button>

      <p className="text-center text-sm text-gray-500">
        Didn&apos;t receive a code?{' '}
        {resendCooldown > 0 ? (
          <span className="text-gray-400">Resend in {resendCooldown}s</span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="font-medium text-blue-600 hover:text-blue-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isResending ? 'Sending…' : 'Resend code'}
          </button>
        )}
      </p>
    </form>
  );
}
