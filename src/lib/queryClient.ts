import { QueryClient } from '@tanstack/react-query';

let toastHandler: ((message: string, type: 'error') => void) | null = null;

export function registerQueryClientToastHandler(
  handler: (message: string, type: 'error') => void,
) {
  toastHandler = handler;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 300_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error: unknown) => {
        const message =
          error instanceof Error ? error.message : 'An unexpected error occurred';
        toastHandler?.(message, 'error');
      },
    },
  },
});
