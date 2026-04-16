'use client';

import { useActiveSessionsQuery } from '@/features/settings/hooks/useActiveSessionsQuery';
import {
  useRevokeSessionMutation,
  useRevokeAllSessionsMutation,
} from '@/features/settings/hooks/useRevokeSessionMutation';
import { SettingsSectionCard } from '../SettingsSectionCard';

function formatLastActive(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ActiveSessionsList() {
  const { data: sessions, isLoading, isError, error } = useActiveSessionsQuery();
  const revokeMutation = useRevokeSessionMutation();
  const revokeAllMutation = useRevokeAllSessionsMutation();

  const otherSessions = sessions?.filter((s) => !s.isCurrent) ?? [];

  return (
    <SettingsSectionCard
      title="Active sessions"
      description="Devices that are currently signed in to your account."
    >
      {isLoading && (
        <div className="space-y-3" aria-busy="true">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
              <div className="space-y-1">
                <div className="h-3.5 w-48 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
              </div>
              <div className="h-7 w-16 animate-pulse rounded-md bg-gray-200" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <p role="alert" className="text-sm text-red-600">
          {error.message}
        </p>
      )}

      {sessions && (
        <div className="space-y-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`flex items-center justify-between rounded-lg p-3 ${
                session.isCurrent ? 'bg-blue-50' : 'bg-gray-50'
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {session.userAgent}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {session.location ? `${session.location} · ` : ''}
                  {formatLastActive(session.lastActiveAt)}
                  {session.isCurrent && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      Current
                    </span>
                  )}
                </p>
              </div>

              {!session.isCurrent && (
                <button
                  type="button"
                  onClick={() => revokeMutation.mutate(session.id)}
                  disabled={revokeMutation.isPending}
                  aria-label={`Revoke session: ${session.userAgent}`}
                  className="ml-4 shrink-0 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-colors hover:bg-red-50 hover:border-red-300 hover:text-red-700 disabled:opacity-50"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}

          {otherSessions.length > 1 && (
            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => revokeAllMutation.mutate()}
                disabled={revokeAllMutation.isPending}
                className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
              >
                {revokeAllMutation.isPending
                  ? 'Revoking all…'
                  : 'Revoke all other sessions'}
              </button>
            </div>
          )}

          {revokeAllMutation.isError && (
            <p role="alert" className="text-sm text-red-600">
              {revokeAllMutation.error.message}
            </p>
          )}
        </div>
      )}
    </SettingsSectionCard>
  );
}
