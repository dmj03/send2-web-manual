import { http, HttpResponse, delay } from 'msw';
import type { LoginCredentials, RegisterPayload, ForgotPasswordPayload, ResetPasswordPayload } from '@/types/auth';
import type { ApiResponse } from '@/types/api';
import { mockUser } from '../fixtures/users';

const BASE = '/auth';

const mockAccessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mockpayload.mocksignature';

export const authHandlers = [
  /** POST /auth/login — append ?fail=true to force a 401 */
  http.post(`${BASE}/login`, async ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('fail') === 'true') {
      return HttpResponse.json(
        { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' },
        { status: 401 },
      );
    }

    const body = await request.json() as LoginCredentials;

    if (!body.email || !body.password) {
      return HttpResponse.json(
        { code: 'VALIDATION_ERROR', field: 'email', message: 'Email and password are required.' },
        { status: 422 },
      );
    }

    const payload: ApiResponse<{ user: typeof mockUser; accessToken: string; expiresAt: string }> =
      {
        data: {
          user: mockUser,
          accessToken: mockAccessToken,
          expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        },
        message: 'Login successful.',
      };

    return HttpResponse.json(payload, { status: 200 });
  }),

  /** POST /auth/register */
  http.post(`${BASE}/register`, async ({ request }) => {
    const body = await request.json() as RegisterPayload;

    if (!body.email || !body.password || !body.name) {
      return HttpResponse.json(
        { code: 'VALIDATION_ERROR', message: 'All fields are required.' },
        { status: 422 },
      );
    }

    const newUser = { ...mockUser, email: body.email, name: body.name, isVerified: false };
    const payload: ApiResponse<{ user: typeof newUser; accessToken: string; expiresAt: string }> =
      {
        data: {
          user: newUser,
          accessToken: mockAccessToken,
          expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        },
        message: 'Registration successful. Please verify your email.',
      };

    return HttpResponse.json(payload, { status: 201 });
  }),

  /** POST /auth/logout */
  http.post(`${BASE}/logout`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  /** POST /auth/forgot-password */
  http.post(`${BASE}/forgot-password`, async ({ request }) => {
    const body = await request.json() as ForgotPasswordPayload;

    if (!body.email) {
      return HttpResponse.json(
        { code: 'VALIDATION_ERROR', field: 'email', message: 'Email is required.' },
        { status: 422 },
      );
    }

    return HttpResponse.json(
      { data: null, message: 'If that email is registered you will receive a reset link.' },
      { status: 200 },
    );
  }),

  /** POST /auth/reset-password */
  http.post(`${BASE}/reset-password`, async ({ request }) => {
    const body = await request.json() as ResetPasswordPayload;

    if (!body.token || !body.newPassword) {
      return HttpResponse.json(
        { code: 'VALIDATION_ERROR', message: 'Token and new password are required.' },
        { status: 422 },
      );
    }

    if (body.newPassword !== body.confirmPassword) {
      return HttpResponse.json(
        { code: 'VALIDATION_ERROR', field: 'confirmPassword', message: 'Passwords do not match.' },
        { status: 422 },
      );
    }

    return HttpResponse.json(
      { data: null, message: 'Password reset successful.' },
      { status: 200 },
    );
  }),

  /** POST /auth/refresh */
  http.post(`${BASE}/refresh`, () => {
    return HttpResponse.json(
      {
        data: {
          accessToken: mockAccessToken,
          expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        },
      },
      { status: 200 },
    );
  }),

  /** POST /auth/verify-otp */
  http.post(`${BASE}/verify-otp`, async ({ request }) => {
    const body = await request.json() as { email: string; otp: string };

    if (body.otp !== '123456') {
      return HttpResponse.json(
        { code: 'INVALID_OTP', message: 'OTP is invalid or has expired.' },
        { status: 400 },
      );
    }

    return HttpResponse.json(
      { data: { ...mockUser, isVerified: true }, message: 'Email verified.' },
      { status: 200 },
    );
  }),
];
