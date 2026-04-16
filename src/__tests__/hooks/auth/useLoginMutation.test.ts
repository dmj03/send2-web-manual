import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/__mocks__/server';
import { useLoginMutation } from '@/hooks/auth/useLoginMutation';
import { useAuthStore, type AuthUser } from '@/stores/authStore';
import React from 'react';

const TEST_BASE = 'http://localhost';

const mockAuthUser: AuthUser = {
  id: 'usr_login_test',
  email: 'james@example.com',
  firstName: 'James',
  lastName: 'Okafor',
  phone: null,
  countryCode: 'GB',
  profileImageUrl: null,
  isEmailVerified: true,
  isPhoneVerified: false,
  firestoreUid: null,
  socialProvider: null,
  createdAt: '2024-01-01T00:00:00.000Z',
};

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
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

beforeEach(() => {
  useAuthStore.setState({
    user: null,
    token: null,
    refreshToken: null,
    isLoading: false,
    isProfileImageUpdating: false,
    referralCode: null,
    error: null,
  });
});

describe('useLoginMutation', () => {
  it('on success: populates the auth store with user and tokens', async () => {
    server.use(
      http.post(`${TEST_BASE}/auth/login`, () =>
        HttpResponse.json({
          data: {
            user: mockAuthUser,
            token: 'jwt-access-token',
            refreshToken: 'jwt-refresh-token',
          },
          message: 'Login successful.',
        }),
      ),
    );

    const { result } = renderHook(() => useLoginMutation(), { wrapper: makeWrapper() });

    await act(async () => {
      await result.current.mutateAsync({
        email: 'james@example.com',
        password: 'password123',
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockAuthUser);
    expect(state.token).toBe('jwt-access-token');
    expect(state.refreshToken).toBe('jwt-refresh-token');
  });

  it('on 401: mutation enters error state and does not update the auth store', async () => {
    server.use(
      http.post(`${TEST_BASE}/auth/login`, () =>
        HttpResponse.json(
          { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' },
          { status: 401 },
        ),
      ),
    );

    const { result } = renderHook(() => useLoginMutation(), { wrapper: makeWrapper() });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          email: 'bad@example.com',
          password: 'wrongpassword',
        });
      } catch {
        // expected to throw
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.code).toBe('INVALID_CREDENTIALS');
    expect(result.current.error?.status).toBe(401);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('on network error: mutation enters error state', async () => {
    server.use(
      http.post(`${TEST_BASE}/auth/login`, () => HttpResponse.error()),
    );

    const { result } = renderHook(() => useLoginMutation(), { wrapper: makeWrapper() });

    await act(async () => {
      try {
        await result.current.mutateAsync({ email: 'x@y.com', password: 'pw' });
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('starts in idle state', () => {
    const { result } = renderHook(() => useLoginMutation(), { wrapper: makeWrapper() });
    expect(result.current.status).toBe('idle');
    expect(result.current.isPending).toBe(false);
  });
});
