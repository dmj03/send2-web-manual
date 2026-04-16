import { ProfileDashboardSkeleton } from '@/features/profile/components/ProfileSkeletons';

export default function DashboardLoading() {
  return (
    <div>
      <div className="mb-6 animate-pulse">
        <div className="h-7 w-32 rounded bg-gray-200" />
        <div className="mt-2 h-4 w-64 rounded bg-gray-100" />
      </div>
      <ProfileDashboardSkeleton />
    </div>
  );
}
