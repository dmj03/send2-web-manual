'use client';

import type { Metadata } from 'next';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { OtpForm } from '@/features/auth/components/OtpForm';
import type { Route } from 'next';
import { ROUTES } from '@/lib/navigation';
import Link from 'next/link';

// Note: metadata cannot be exported from a 'use client' page — moved to a wrapper.
// The parent layout sets a generic title; this page renders the form client-side.

function RegisterOtpInner() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';

  if (!email) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-gray-600">No email address found. Please start registration again.</p>
        <Link href={ROUTES.auth.register as Route} className="text-sm font-medium text-blue-600 hover:underline">
          Back to registration
        </Link>
      </div>
    );
  }

  return <OtpForm email={email} />;
}

export default function RegisterOtpPage() {
  return (
    <Suspense>
      <RegisterOtpInner />
    </Suspense>
  );
}
