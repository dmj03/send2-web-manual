import type { Metadata } from 'next';
import { ReactivateForm } from '@/features/auth/components/ReactivateForm';

export const metadata: Metadata = {
  title: 'Reactivate Account | Send2',
  description: 'Reactivate your Send2 account.',
  robots: { index: false, follow: false },
};

export default function ReactivatePage() {
  return <ReactivateForm />;
}
