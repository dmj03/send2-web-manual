import { PersonalInfoSkeleton } from '@/features/profile/components/ProfileSkeletons';

export default function ConsentLoading() {
  return (
    <div>
      <div className="mb-6 animate-pulse">
        <div className="h-7 w-44 rounded bg-gray-200" />
        <div className="mt-2 h-4 w-72 rounded bg-gray-100" />
      </div>
      <PersonalInfoSkeleton />
    </div>
  );
}
