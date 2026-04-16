'use client';

import { useState, useEffect, useCallback } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient, registerQueryClientToastHandler } from '@/lib/queryClient';
import { useUiStore, selectToasts } from '@/stores/uiStore';

// ---------------------------------------------------------------------------
// Toast renderer — driven by uiStore, auto-dismisses after duration
// ---------------------------------------------------------------------------

function ToastContainer() {
  const toasts = useUiStore(selectToasts);
  const dismissToast = useUiStore((s) => s.dismissToast);

  useEffect(() => {
    toasts.forEach((toast) => {
      const duration = toast.duration ?? 5000;
      const timer = window.setTimeout(() => dismissToast(toast.id), duration);
      return () => window.clearTimeout(timer);
    });
  }, [toasts, dismissToast]);

  if (toasts.length === 0) return null;

  const colorMap: Record<string, string> = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
    warning: 'bg-yellow-500',
  };

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className={`flex items-start justify-between gap-3 rounded-lg px-4 py-3 text-white shadow-lg text-sm ${colorMap[toast.type] ?? 'bg-gray-800'}`}
        >
          <span className="flex-1">{toast.message}</span>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss notification"
            className="shrink-0 text-white/80 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// QueryClientBridge — registers the toast handler once on mount
// ---------------------------------------------------------------------------

function QueryClientBridge() {
  const pushToast = useUiStore((s) => s.pushToast);

  const handler = useCallback(
    (message: string, type: 'error') => {
      pushToast({ message, type });
    },
    [pushToast],
  );

  useEffect(() => {
    registerQueryClientToastHandler(handler);
  }, [handler]);

  return null;
}

// ---------------------------------------------------------------------------
// Providers — top-level provider tree
// ---------------------------------------------------------------------------

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  // Ensure QueryClient is stable across HMR in development
  const [client] = useState(() => queryClient);

  return (
    <QueryClientProvider client={client}>
      <QueryClientBridge />
      {children}
      <ToastContainer />
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      )}
    </QueryClientProvider>
  );
}
