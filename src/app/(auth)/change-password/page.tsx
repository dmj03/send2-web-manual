import type { Metadata } from 'next';
import { ChangePasswordForm } from '@/features/auth/components/ChangePasswordForm';

export const metadata: Metadata = {
  title: 'Change Password | Send2',
  description: 'Set a new password for your Send2 account.',
  robots: { index: false, follow: false },
};

export default function ChangePasswordPage() {
  return <ChangePasswordForm />;
}
