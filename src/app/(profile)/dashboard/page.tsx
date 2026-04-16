'use client';

import { DashboardOverview } from '@/features/profile/components/DashboardOverview';

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back — here&apos;s an overview of your account.
        </p>
      </div>
      <DashboardOverview />
    </div>
  );
}
