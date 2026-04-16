'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useProfileQuery, useUpdateProfileMutation } from '@/hooks/profile';
import { ProfileAvatar } from './ProfileAvatar';
import type { UpdateProfilePayload } from '@/types/profile';

// ─── Schema ───────────────────────────────────────────────────────────────────

const personalInfoSchema = z.object({
  name: z.string().min(2, 'Full name must be at least 2 characters'),
  phoneNumber: z
    .string()
    .regex(/^\+?\d{7,15}$/, 'Enter a valid phone number (e.g. +447700123456)')
    .or(z.literal('')),
  preferredCurrency: z.string().length(3, 'Select a currency'),
  preferredCountry: z.string().length(2, 'Select a country'),
  addressLine1: z.string(),
  addressLine2: z.string(),
  addressCity: z.string(),
  addressState: z.string(),
  addressPostalCode: z.string(),
  addressCountry: z.string().length(2, 'Select address country').or(z.literal('')),
});

type PersonalInfoValues = z.infer<typeof personalInfoSchema>;

// ─── Static data ──────────────────────────────────────────────────────────────

const CURRENCIES = [
  { code: 'GBP', label: 'GBP — British Pound' },
  { code: 'EUR', label: 'EUR — Euro' },
  { code: 'USD', label: 'USD — US Dollar' },
  { code: 'AUD', label: 'AUD — Australian Dollar' },
  { code: 'CAD', label: 'CAD — Canadian Dollar' },
  { code: 'NGN', label: 'NGN — Nigerian Naira' },
  { code: 'GHS', label: 'GHS — Ghanaian Cedi' },
  { code: 'KES', label: 'KES — Kenyan Shilling' },
  { code: 'INR', label: 'INR — Indian Rupee' },
  { code: 'PHP', label: 'PHP — Philippine Peso' },
];

const COUNTRIES = [
  { code: 'GB', label: 'United Kingdom' },
  { code: 'NG', label: 'Nigeria' },
  { code: 'GH', label: 'Ghana' },
  { code: 'KE', label: 'Kenya' },
  { code: 'IN', label: 'India' },
  { code: 'PH', label: 'Philippines' },
  { code: 'PK', label: 'Pakistan' },
  { code: 'BD', label: 'Bangladesh' },
  { code: 'US', label: 'United States' },
  { code: 'CA', label: 'Canada' },
  { code: 'AU', label: 'Australia' },
  { code: 'DE', label: 'Germany' },
  { code: 'FR', label: 'France' },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function buildPayload(values: PersonalInfoValues): UpdateProfilePayload {
  const payload: UpdateProfilePayload = {};

  if (values.name !== '') payload.name = values.name;
  if (values.phoneNumber !== '') payload.phoneNumber = values.phoneNumber;
  if (values.preferredCurrency !== '') payload.preferredCurrency = values.preferredCurrency;
  if (values.preferredCountry !== '') payload.preferredCountry = values.preferredCountry;
  if (values.addressLine1 !== '') {
    payload.address = {
      line1: values.addressLine1,
      line2: values.addressLine2 !== '' ? values.addressLine2 : null,
      city: values.addressCity,
      state: values.addressState !== '' ? values.addressState : null,
      postalCode: values.addressPostalCode,
      country: values.addressCountry,
    };
  }

  return payload;
}

// ─── Form field wrapper ───────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  error?: string | undefined;
  htmlFor: string;
  children: React.ReactNode;
  hint?: string | undefined;
}

function Field({ label, error, htmlFor, children, hint }: FieldProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

const INPUT_CLS =
  'block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 aria-invalid:border-red-400';

const SELECT_CLS =
  'block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 aria-invalid:border-red-400';

// ─── Component ────────────────────────────────────────────────────────────────

export function PersonalInfoForm() {
  const { data: profile, isPending: isLoadingProfile } = useProfileQuery();
  const updateMutation = useUpdateProfileMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<PersonalInfoValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      name: '',
      phoneNumber: '',
      preferredCurrency: 'GBP',
      preferredCountry: 'GB',
      addressLine1: '',
      addressLine2: '',
      addressCity: '',
      addressState: '',
      addressPostalCode: '',
      addressCountry: '',
    },
  });

  // Populate form once profile data arrives
  useEffect(() => {
    if (!profile) return;
    reset({
      name: profile.name,
      phoneNumber: profile.phoneNumber ?? '',
      preferredCurrency: profile.preferredCurrency,
      preferredCountry: profile.preferredCountry,
      addressLine1: profile.address?.line1 ?? '',
      addressLine2: profile.address?.line2 ?? '',
      addressCity: profile.address?.city ?? '',
      addressState: profile.address?.state ?? '',
      addressPostalCode: profile.address?.postalCode ?? '',
      addressCountry: profile.address?.country ?? '',
    });
  }, [profile, reset]);

  function onSubmit(values: PersonalInfoValues) {
    const payload = buildPayload(values);
    updateMutation.mutate(payload, {
      onSuccess: () => reset(values),
    });
  }

  if (isLoadingProfile) {
    return (
      <div className="animate-pulse rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-6 h-6 w-32 rounded bg-gray-200" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-20 rounded bg-gray-200" />
              <div className="h-10 w-full rounded-xl bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const isPending = isSubmitting || updateMutation.isPending;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Personal information form"
      className="space-y-8"
    >
      {/* Avatar */}
      <div className="flex flex-col items-center rounded-2xl border bg-white p-6 shadow-sm sm:flex-row sm:items-start sm:gap-6">
        <ProfileAvatar />
        <div className="mt-4 text-center sm:mt-0 sm:text-left">
          <p className="text-sm font-semibold text-gray-900">Profile photo</p>
          <p className="mt-1 text-xs text-gray-500">
            JPEG, PNG or WebP · max 5 MB
          </p>
        </div>
      </div>

      {/* Basic info */}
      <section
        aria-labelledby="basic-info-heading"
        className="rounded-2xl border bg-white p-6 shadow-sm"
      >
        <h2 id="basic-info-heading" className="mb-5 text-base font-semibold text-gray-900">
          Basic information
        </h2>

        {updateMutation.isError && (
          <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {updateMutation.error.message || 'Update failed. Please try again.'}
          </div>
        )}

        {updateMutation.isSuccess && (
          <div role="status" className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Profile updated successfully.
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" htmlFor="name" error={errors.name?.message}>
            <input
              id="name"
              type="text"
              autoComplete="name"
              {...register('name')}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
              className={INPUT_CLS}
              placeholder="Jane Doe"
            />
          </Field>

          <Field
            label="Phone number"
            htmlFor="phoneNumber"
            error={errors.phoneNumber?.message}
            hint="Include country code, e.g. +447700123456"
          >
            <input
              id="phoneNumber"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              {...register('phoneNumber')}
              aria-invalid={!!errors.phoneNumber}
              className={INPUT_CLS}
              placeholder="+447700123456"
            />
          </Field>

          <Field
            label="Preferred send currency"
            htmlFor="preferredCurrency"
            error={errors.preferredCurrency?.message}
          >
            <select
              id="preferredCurrency"
              {...register('preferredCurrency')}
              aria-invalid={!!errors.preferredCurrency}
              className={SELECT_CLS}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Preferred receive country"
            htmlFor="preferredCountry"
            error={errors.preferredCountry?.message}
          >
            <select
              id="preferredCountry"
              {...register('preferredCountry')}
              aria-invalid={!!errors.preferredCountry}
              className={SELECT_CLS}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      {/* Address */}
      <section
        aria-labelledby="address-heading"
        className="rounded-2xl border bg-white p-6 shadow-sm"
      >
        <h2 id="address-heading" className="mb-5 text-base font-semibold text-gray-900">
          Address <span className="ml-1 text-xs font-normal text-gray-400">(optional)</span>
        </h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Address line 1" htmlFor="addressLine1" error={errors.addressLine1?.message}>
              <input
                id="addressLine1"
                type="text"
                autoComplete="address-line1"
                {...register('addressLine1')}
                aria-invalid={!!errors.addressLine1}
                className={INPUT_CLS}
                placeholder="123 High Street"
              />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="Address line 2" htmlFor="addressLine2">
              <input
                id="addressLine2"
                type="text"
                autoComplete="address-line2"
                {...register('addressLine2')}
                className={INPUT_CLS}
                placeholder="Flat 4B"
              />
            </Field>
          </div>

          <Field label="City" htmlFor="addressCity" error={errors.addressCity?.message}>
            <input
              id="addressCity"
              type="text"
              autoComplete="address-level2"
              {...register('addressCity')}
              aria-invalid={!!errors.addressCity}
              className={INPUT_CLS}
              placeholder="London"
            />
          </Field>

          <Field label="State / Region" htmlFor="addressState">
            <input
              id="addressState"
              type="text"
              autoComplete="address-level1"
              {...register('addressState')}
              className={INPUT_CLS}
              placeholder="England"
            />
          </Field>

          <Field label="Postal code" htmlFor="addressPostalCode" error={errors.addressPostalCode?.message}>
            <input
              id="addressPostalCode"
              type="text"
              autoComplete="postal-code"
              {...register('addressPostalCode')}
              aria-invalid={!!errors.addressPostalCode}
              className={INPUT_CLS}
              placeholder="SW1A 1AA"
            />
          </Field>

          <Field
            label="Country"
            htmlFor="addressCountry"
            error={errors.addressCountry?.message}
          >
            <select
              id="addressCountry"
              {...register('addressCountry')}
              aria-invalid={!!errors.addressCountry}
              className={SELECT_CLS}
            >
              <option value="">Select country…</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <button
        type="submit"
        disabled={isPending || !isDirty}
        className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <>
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Saving…
          </>
        ) : (
          'Save changes'
        )}
      </button>
    </form>
  );
}
