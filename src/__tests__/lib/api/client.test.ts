import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/__mocks__/server';
import { apiClient, ApiClientError } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';
import type { AuthUser } from '@/stores/authStore';

const TEST_BASE = 'http://localhost';

const mockAuthUser: AuthUser = {
  id: 'usr_test',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  phone: null,
  countryCode: null,
  profileImageUrl: null,
  isEmailVerified: true,
  isPhoneVerified: false,
  firestoreUid: null,
  socialProvider: null,
  createdAt: '2024-01-01T00:00:00.000Z',
};

beforeAll(() => {
  process.env['NEXT_PUBLIC_API_BASE_URL'] = TEST_BASE;
});

afterAll(() => {
  delete process.env['NEXT_PUBLIC_API_BASE_URL'];
});

beforeEach(() => {
  useAuthStore.setState({ user: null, token: null });
});

describe('apiClient — GET', () => {
  it('sends a GET request to the correct URL', async () => {
    let capturedUrl: string | undefined;
    server.use(
      http.get(`${TEST_BASE}/test/endpoint`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ data: { ok: true } });
      }),
    );

    await apiClient.get('/test/endpoint');
    expect(capturedUrl).toBe(`${TEST_BASE}/test/endpoint`);
  });

  it('includes Authorization header when token is set', async () => {
    let capturedAuth: string | null = null;
    server.use(
      http.get(`${TEST_BASE}/secure/data`, ({ request }) => {
        capturedAuth = request.headers.get('Authorization');
        return HttpResponse.json({ data: {} });
      }),
    );

    useAuthStore.getState().login(mockAuthUser, 'bearer-token-123', 'refresh');

    await apiClient.get('/secure/data');
    expect(capturedAuth).toBe('Bearer bearer-token-123');
  });

  it('does not include Authorization header when no token', async () => {
    let capturedAuth: string | null = null;
    server.use(
      http.get(`${TEST_BASE}/public/data`, ({ request }) => {
        capturedAuth = request.headers.get('Authorization');
        return HttpResponse.json({ data: {} });
      }),
    );

    await apiClient.get('/public/data');
    expect(capturedAuth).toBeNull();
  });

  it('passes AbortSignal through to the request', async () => {
    const controller = new AbortController();
    let requestReceived = false;

    server.use(
      http.get(`${TEST_BASE}/abortable`, async () => {
        requestReceived = true;
        // Delay so abort can fire
        await new Promise((r) => setTimeout(r, 50));
        return HttpResponse.json({ data: {} });
      }),
    );

    controller.abort();

    await expect(
      apiClient.get('/abortable', { signal: controller.signal }),
    ).rejects.toThrow();
    // The thrown error should be an AbortError (or similar signal-abort error)
  });
});

describe('apiClient — error handling', () => {
  it('throws ApiClientError with correct code and status on 401', async () => {
    server.use(
      http.get(`${TEST_BASE}/protected`, () =>
        HttpResponse.json(
          { code: 'UNAUTHORIZED', message: 'Not authenticated.' },
          { status: 401 },
        ),
      ),
    );

    await expect(apiClient.get('/protected')).rejects.toMatchObject({
      name: 'ApiClientError',
      code: 'UNAUTHORIZED',
      status: 401,
      message: 'Not authenticated.',
    });
  });

  it('throws ApiClientError with correct code and status on 404', async () => {
    server.use(
      http.get(`${TEST_BASE}/missing`, () =>
        HttpResponse.json(
          { code: 'NOT_FOUND', message: 'Resource not found.' },
          { status: 404 },
        ),
      ),
    );

    await expect(apiClient.get('/missing')).rejects.toBeInstanceOf(ApiClientError);
  });

  it('throws ApiClientError on 500 with fallback code when body is unparseable', async () => {
    server.use(
      http.get(`${TEST_BASE}/broken`, () =>
        new HttpResponse('Internal Server Error', {
          status: 500,
          headers: { 'Content-Type': 'text/plain' },
        }),
      ),
    );

    const err = await apiClient.get('/broken').catch((e) => e);
    expect(err).toBeInstanceOf(ApiClientError);
    expect(err.status).toBe(500);
  });

  it('includes field on ApiClientError when API returns a field-level error', async () => {
    server.use(
      http.post(`${TEST_BASE}/validate`, () =>
        HttpResponse.json(
          { code: 'VALIDATION_ERROR', field: 'email', message: 'Email is invalid.' },
          { status: 422 },
        ),
      ),
    );

    const err = await apiClient.post('/validate', {}).catch((e) => e);
    expect(err).toBeInstanceOf(ApiClientError);
    expect(err.field).toBe('email');
  });
});

describe('apiClient — POST', () => {
  it('sends JSON body with correct Content-Type', async () => {
    let receivedBody: unknown;
    let receivedContentType: string | null = null;
    server.use(
      http.post(`${TEST_BASE}/submit`, async ({ request }) => {
        receivedBody = await request.json();
        receivedContentType = request.headers.get('Content-Type');
        return HttpResponse.json({ data: { ok: true } });
      }),
    );

    await apiClient.post('/submit', { name: 'Send2', amount: 100 });
    expect(receivedBody).toEqual({ name: 'Send2', amount: 100 });
    expect(receivedContentType).toContain('application/json');
  });
});
