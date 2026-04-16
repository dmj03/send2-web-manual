'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { OtpForm } from '@/features/auth/components/OtpForm';
import type { Route } from 'next';
import { ROUTES } from '@/lib/navigation';

function OtpInner() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';

  if (!email) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-gray-600">
          No email address provided. Please sign in or register first.
        </p>
        <Link href={ROUTES.auth.login as Route} className="text-sm font-medium text-blue-600 hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return <OtpForm email={email} />;
}

export default function OtpPage() {
  return (
    <Suspense>
      <OtpInner />
    </Suspense>
  );
}
