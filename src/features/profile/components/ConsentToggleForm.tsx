'use client';

import { useProfileQuery, useUpdateProfileMutation } from '@/hooks/profile';
import { PersonalInfoSkeleton } from './ProfileSkeletons';

interface ToggleRowProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function ToggleRow({ id, label, description, checked, onChange, disabled }: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-6 py-5">
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-medium text-gray-900 cursor-pointer">
          {label}
        </label>
        <p className="mt-0.5 text-sm text-gray-500">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? 'bg-blue-600' : 'bg-gray-200'
        }`}
      >
        <span className="sr-only">{label}</span>
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

export function ConsentToggleForm() {
  const { data: profile, isPending } = useProfileQuery();
  const updateMutation = useUpdateProfileMutation();

  if (isPending) return <PersonalInfoSkeleton />;

  function handleMarketingToggle(enabled: boolean) {
    updateMutation.mutate({ marketingOptIn: enabled });
  }

  const isUpdating = updateMutation.isPending;

  return (
    <div className="space-y-6">
      {updateMutation.isError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {updateMutation.error.message || 'Failed to update preferences. Please try again.'}
        </div>
      )}

      {/* Marketing preferences */}
      <section
        aria-labelledby="marketing-heading"
        className="rounded-2xl border bg-white px-6 shadow-sm divide-y divide-gray-100"
      >
        <h2 id="marketing-heading" className="py-5 text-base font-semibold text-gray-900">
          Marketing preferences
        </h2>
        <ToggleRow
          id="marketing-opt-in"
          label="Marketing emails"
          description="Receive news, promotions, and product updates from Send2."
          checked={profile?.marketingOptIn ?? false}
          onChange={handleMarketingToggle}
          disabled={isUpdating}
        />
      </section>

      {/* Privacy info */}
      <section
        aria-labelledby="privacy-heading"
        className="rounded-2xl border bg-white px-6 shadow-sm divide-y divide-gray-100"
      >
        <h2 id="privacy-heading" className="py-5 text-base font-semibold text-gray-900">
          Your data rights
        </h2>
        <div className="py-5 space-y-4 text-sm text-gray-600">
          <p>
            Under GDPR and applicable data protection laws, you have the right to access, rectify,
            and erase your personal data.
          </p>
          <p>
            To request a copy of your data or to submit a deletion request, please contact our
            support team.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <a
              href="/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              Privacy policy
            </a>
            <span aria-hidden="true" className="text-gray-300">|</span>
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              Terms of service
            </a>
            <span aria-hidden="true" className="text-gray-300">|</span>
            <a
              href="mailto:privacy@send2.com"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              Contact privacy team
            </a>
          </div>
        </div>
      </section>

      {/* Account actions */}
      <section
        aria-labelledby="account-actions-heading"
        className="rounded-2xl border bg-white px-6 shadow-sm divide-y divide-gray-100"
      >
        <h2 id="account-actions-heading" className="py-5 text-base font-semibold text-gray-900">
          Account actions
        </h2>
        <div className="py-5">
          <p className="mb-4 text-sm text-gray-600">
            Permanently delete your account and all associated data. This action is irreversible.
          </p>
          <button
            type="button"
            className="rounded-xl border border-red-300 px-5 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
          >
            Request account deletion
          </button>
        </div>
      </section>
    </div>
  );
}
