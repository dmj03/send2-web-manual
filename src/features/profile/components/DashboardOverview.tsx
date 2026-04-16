'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Route } from 'next';
import { useAuthStore } from '@/stores/authStore';
import { useProfileQuery } from '@/hooks/profile';
import { useNotificationsQuery } from '@/hooks/notifications';
import { useRateAlertsQuery } from '@/hooks/rateAlerts';
import type { AppNotification } from '@/types/notification';

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  href: Route;
  color: string;
}

function StatCard({ icon, value, label, href, color }: StatCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-2 rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 group-hover:text-gray-700">{label}</p>
    </Link>
  );
}

// ─── Notification icon by type ────────────────────────────────────────────────

function notificationTypeColor(type: AppNotification['type']): string {
  const map: Record<AppNotification['type'], string> = {
    rate_alert_triggered: 'bg-amber-100 text-amber-600',
    transfer_complete: 'bg-green-100 text-green-600',
    transfer_failed: 'bg-red-100 text-red-600',
    kyc_approved: 'bg-green-100 text-green-600',
    kyc_rejected: 'bg-red-100 text-red-600',
    promotion: 'bg-purple-100 text-purple-600',
    system: 'bg-gray-100 text-gray-600',
    news: 'bg-blue-100 text-blue-600',
  };
  return map[type];
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DashboardOverview() {
  const user = useAuthStore((s) => s.user);
  const { data: profile } = useProfileQuery();
  const { data: notifications } = useNotificationsQuery();
  const { data: rateAlerts } = useRateAlertsQuery();

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;
  const alertCount = rateAlerts?.length ?? 0;
  const recentNotifications = notifications?.slice(0, 3) ?? [];

  return (
    <div className="space-y-8">
      {/* Identity card */}
      <div className="flex items-center gap-5 rounded-2xl border bg-white p-6 shadow-sm">
        <div className="relative shrink-0">
          {user?.profileImageUrl ? (
            <Image
              src={user.profileImageUrl}
              alt={`${user.firstName} ${user.lastName}`}
              width={80}
              height={80}
              className="rounded-full object-cover"
            />
          ) : (
            <div
              className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700"
              aria-hidden="true"
            >
              {user?.firstName.charAt(0).toUpperCase() ?? '?'}
            </div>
          )}
          {user?.isEmailVerified && (
            <span
              className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-green-500 ring-2 ring-white"
              title="Email verified"
            >
              <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-xl font-bold text-gray-900">
            {user ? `${user.firstName} ${user.lastName}` : 'Welcome back!'}
          </h2>
          <p className="mt-0.5 truncate text-sm text-gray-500">{user?.email}</p>
          {profile?.preferredCurrency && (
            <p className="mt-1 text-xs text-gray-400">
              Preferred currency:{' '}
              <span className="font-medium text-gray-600">
                {profile.preferredCurrency}
              </span>
            </p>
          )}
        </div>

        <Link
          href="/personal-info"
          className="hidden shrink-0 rounded-xl border px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-blue-500 hover:text-blue-600 sm:block"
        >
          Edit profile
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          href="/rate-alerts"
          value={alertCount}
          label="Rate alerts"
          color="bg-amber-100 text-amber-600"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          }
        />
        <StatCard
          href="/notifications"
          value={unreadCount}
          label="Unread messages"
          color="bg-blue-100 text-blue-600"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />
        <StatCard
          href="/search-history"
          value="View"
          label="Search history"
          color="bg-gray-100 text-gray-600"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          href="/referral"
          value="Refer"
          label="Earn rewards"
          color="bg-purple-100 text-purple-600"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Recent notifications */}
      <section aria-labelledby="recent-activity-heading">
        <div className="mb-3 flex items-center justify-between">
          <h3 id="recent-activity-heading" className="text-sm font-semibold text-gray-900">
            Recent notifications
          </h3>
          <Link href="/notifications" className="text-xs font-medium text-blue-600 hover:underline">
            View all
          </Link>
        </div>

        {recentNotifications.length === 0 ? (
          <div className="rounded-2xl border bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-gray-500">No notifications yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-2xl border bg-white shadow-sm">
            {recentNotifications.map((n) => (
              <li key={n.id} className="flex items-start gap-3 px-5 py-4">
                <div
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${notificationTypeColor(n.type)}`}
                  aria-hidden="true"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${n.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
                    {n.title}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{n.body}</p>
                </div>
                {!n.isRead && (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" aria-label="Unread" />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
