'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { OtpForm } from '@/features/auth/components/OtpForm';
import type { Route } from 'next';
import { ROUTES } from '@/lib/navigation';

function ForgotPasswordOtpInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';

  if (!email) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-gray-600">No email address found. Please restart the password reset flow.</p>
        <Link href={ROUTES.auth.forgotPassword as Route} className="text-sm font-medium text-blue-600 hover:underline">
          Back to forgot password
        </Link>
      </div>
    );
  }

  return (
    <OtpForm
      email={email}
      onSuccess={() => router.push(ROUTES.auth.changePassword as Route)}
    />
  );
}

export default function ForgotPasswordOtpPage() {
  return (
    <Suspense>
      <ForgotPasswordOtpInner />
    </Suspense>
  );
}
