import { Suspense } from 'react';
import type { Metadata } from 'next';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export const metadata: Metadata = {
  title: 'Create Account | Send2',
  description: 'Create a free Send2 account to compare international money transfer rates and save on your remittances.',
};

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
