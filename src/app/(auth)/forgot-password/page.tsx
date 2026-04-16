import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Forgot Password | Send2',
  description: 'Reset your Send2 password — enter your email and we\'ll send you a reset link.',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
