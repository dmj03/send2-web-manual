'use client';

import { useState } from 'react';
import { useReferralQuery } from '@/features/profile/hooks/useReferralQuery';
import { ReferralSkeleton } from './ProfileSkeletons';

function StatBadge({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-gray-50 px-4 py-3 text-center">
      <span className="text-xl font-bold text-gray-900">{value}</span>
      <span className="mt-0.5 text-xs text-gray-500">{label}</span>
    </div>
  );
}

export function ReferralCard() {
  const { data: referral, isPending, isError, error } = useReferralQuery();
  const [copied, setCopied] = useState(false);

  if (isPending) return <ReferralSkeleton />;

  if (isError) {
    return (
      <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error.message || 'Failed to load referral info.'}
      </div>
    );
  }

  // Capture in a stable const so TypeScript can narrow type in async closures
  const info = referral;
  if (!info) return <ReferralSkeleton />;

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(info.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the text manually
    }
  }

  async function handleCopyUrl() {
    try {
      await navigator.clipboard.writeText(info.referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }

  function handleShareNative() {
    if (!navigator.share) return;
    void navigator.share({
      title: 'Join Send2',
      text: `Use my referral code ${info.code} to sign up on Send2 and get started with great exchange rates!`,
      url: info.referralUrl,
    });
  }

  return (
    <div className="space-y-6">
      {/* Code card */}
      <section
        aria-labelledby="referral-code-heading"
        className="rounded-2xl border bg-white p-6 shadow-sm"
      >
        <h2 id="referral-code-heading" className="mb-1 text-base font-semibold text-gray-900">
          Your referral code
        </h2>
        <p className="mb-5 text-sm text-gray-500">
          Share your code and earn rewards when friends sign up and send money.
        </p>

        {/* Code display */}
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-blue-300 bg-blue-50 px-5 py-4">
          <span className="flex-1 text-2xl font-bold tracking-widest text-blue-700">
            {info.code}
          </span>
          <button
            type="button"
            onClick={handleCopyCode}
            aria-label="Copy referral code"
            className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-600 shadow-sm transition hover:border-blue-400 hover:bg-blue-50"
          >
            {copied ? (
              <>
                <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>
        </div>

        {/* Referral URL */}
        <div className="mt-4 flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={info.referralUrl}
            aria-label="Referral link"
            className="flex-1 truncate rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleCopyUrl}
            aria-label="Copy referral link"
            className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
          >
            Copy link
          </button>
          {'share' in navigator && (
            <button
              type="button"
              onClick={handleShareNative}
              aria-label="Share referral link"
              className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
            >
              Share
            </button>
          )}
        </div>
      </section>

      {/* Stats */}
      <section
        aria-labelledby="referral-stats-heading"
        className="rounded-2xl border bg-white p-6 shadow-sm"
      >
        <h2 id="referral-stats-heading" className="mb-5 text-base font-semibold text-gray-900">
          Your rewards
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <StatBadge value={info.totalReferrals} label="Total referrals" />
          <StatBadge
            value={info.pendingRewards.toLocaleString('en-GB', {
              style: 'currency',
              currency: info.currency,
            })}
            label="Pending rewards"
          />
          <StatBadge
            value={info.totalEarned.toLocaleString('en-GB', {
              style: 'currency',
              currency: info.currency,
            })}
            label="Total earned"
          />
        </div>
      </section>

      {/* How it works */}
      <section
        aria-labelledby="how-it-works-heading"
        className="rounded-2xl border bg-white p-6 shadow-sm"
      >
        <h2 id="how-it-works-heading" className="mb-4 text-base font-semibold text-gray-900">
          How it works
        </h2>
        <ol className="space-y-3 text-sm text-gray-600">
          {[
            'Share your unique referral code or link with friends and family.',
            'They sign up using your code and complete their first transfer.',
            'Both of you receive a reward once their transfer is confirmed.',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
