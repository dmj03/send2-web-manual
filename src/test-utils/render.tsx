import React from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';

/**
 * Creates a fresh QueryClient per test so cache does not bleed between tests.
 * Retries are disabled to prevent slow tests on expected failures.
 */
function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface RenderWithProvidersOptions extends Omit<RenderOptions, 'wrapper'> {
  /** Pre-populate auth store before rendering. Pass null to explicitly clear. */
  initialAuthState?: Parameters<typeof useAuthStore.setState>[0] | null;
}

/**
 * Drop-in replacement for RTL `render` that wraps the component under test in
 * all application providers: QueryClientProvider and Zustand store isolation.
 *
 * @example
 * const { getByText } = renderWithProviders(<MyComponent />);
 */
export function renderWithProviders(
  ui: React.ReactElement,
  { initialAuthState, ...options }: RenderWithProvidersOptions = {},
): RenderResult {
  const queryClient = makeQueryClient();

  if (initialAuthState !== undefined) {
    if (initialAuthState === null) {
      useAuthStore.setState({ user: null, token: null });
    } else {
      useAuthStore.setState(initialAuthState);
    }
  }

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

export * from '@testing-library/react';
