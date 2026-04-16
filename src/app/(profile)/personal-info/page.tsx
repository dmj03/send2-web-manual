'use client';

import { PersonalInfoForm } from '@/features/profile/components/PersonalInfoForm';
import { ChangePasswordForm } from '@/features/profile/components/ChangePasswordForm';

export default function PersonalInfoPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Personal information</h1>
        <p className="mt-1 text-sm text-gray-500">
          Update your profile details, address, and password.
        </p>
      </div>
      <div className="space-y-8">
        <PersonalInfoForm />
        <ChangePasswordForm />
      </div>
    </div>
  );
}
