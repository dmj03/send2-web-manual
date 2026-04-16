import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/__mocks__/server';
import { useSearchQuery } from '@/hooks/search/useSearchQuery';
import { mockSearchResults, mockSearchFilters } from '@/__mocks__/fixtures/search';
import type { SearchFilters } from '@/types/search';
import React from 'react';

const TEST_BASE = 'http://localhost';

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

beforeAll(() => {
  process.env['NEXT_PUBLIC_API_BASE_URL'] = TEST_BASE;
});

afterAll(() => {
  delete process.env['NEXT_PUBLIC_API_BASE_URL'];
});

describe('useSearchQuery', () => {
  it('fetches search results with correct query params', async () => {
    let capturedUrl: URL | undefined;
    server.use(
      http.get(`${TEST_BASE}/search`, ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json({ data: mockSearchResults });
      }),
    );

    const { result } = renderHook(() => useSearchQuery(mockSearchFilters), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(capturedUrl).toBeDefined();
    expect(capturedUrl!.searchParams.get('sendAmount')).toBe('500');
    expect(capturedUrl!.searchParams.get('sendCurrency')).toBe('GBP');
    expect(capturedUrl!.searchParams.get('receiveCurrency')).toBe('USD');
    expect(capturedUrl!.searchParams.get('receiveCountry')).toBe('US');
  });

  it('is disabled when filters is null', () => {
    const { result } = renderHook(() => useSearchQuery(null), { wrapper: makeWrapper() });

    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.data).toBeUndefined();
  });

  it('is disabled when enabled=false', () => {
    const { result } = renderHook(() => useSearchQuery(mockSearchFilters, false), {
      wrapper: makeWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
  });

  it('returns placeholderData (previous data) while a new query is loading', async () => {
    let requestCount = 0;
    server.use(
      http.get(`${TEST_BASE}/search`, async () => {
        requestCount += 1;
        if (requestCount > 1) {
          // Delay second request
          await new Promise((r) => setTimeout(r, 100));
        }
        return HttpResponse.json({ data: mockSearchResults });
      }),
    );

    const filters1: SearchFilters = { ...mockSearchFilters, sendAmount: 500 };
    const filters2: SearchFilters = { ...mockSearchFilters, sendAmount: 1000 };

    let currentFilters = filters1;
    const { result, rerender } = renderHook(() => useSearchQuery(currentFilters), {
      wrapper: makeWrapper(),
    });

    // Wait for initial data
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const initialData = result.current.data;

    // Change filters to trigger new fetch — previous data should persist via placeholderData
    currentFilters = filters2;
    rerender();

    // During the new fetch, data should still be the previous result (not undefined)
    expect(result.current.data).toEqual(initialData);
  });

  it('uses staleTime 0 — data is always considered stale', async () => {
    server.use(
      http.get(`${TEST_BASE}/search`, () => HttpResponse.json({ data: mockSearchResults })),
    );

    const { result } = renderHook(() => useSearchQuery(mockSearchFilters), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // With staleTime:0, data is immediately stale after it arrives
    expect(result.current.isStale).toBe(true);
  });

  it('enters error state on non-OK response', async () => {
    server.use(
      http.get(`${TEST_BASE}/search`, () =>
        HttpResponse.json(
          { code: 'INTERNAL_ERROR', message: 'Server error.' },
          { status: 500 },
        ),
      ),
    );

    const { result } = renderHook(() => useSearchQuery(mockSearchFilters), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.status).toBe(500);
  });
});
