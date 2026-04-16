import { describe, it, expect, beforeEach } from 'vitest';
import {
  useAuthStore,
  selectIsAuthenticated,
  selectUser,
  selectAuthError,
  selectToken,
  type AuthUser,
} from '@/stores/authStore';

const mockAuthUser: AuthUser = {
  id: 'usr_01',
  email: 'james@example.com',
  firstName: 'James',
  lastName: 'Okafor',
  phone: '+447700900123',
  countryCode: 'GB',
  profileImageUrl: null,
  isEmailVerified: true,
  isPhoneVerified: false,
  firestoreUid: null,
  socialProvider: null,
  createdAt: '2024-01-01T00:00:00.000Z',
};

beforeEach(() => {
  // Reset to a known initial state before every test
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

describe('authStore — login action', () => {
  it('sets user, token, and refreshToken on login', () => {
    useAuthStore.getState().login(mockAuthUser, 'tok_abc', 'ref_xyz');

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockAuthUser);
    expect(state.token).toBe('tok_abc');
    expect(state.refreshToken).toBe('ref_xyz');
  });

  it('clears any previous error on login', () => {
    useAuthStore.getState().setError('previous error');
    useAuthStore.getState().login(mockAuthUser, 'tok', 'ref');

    expect(useAuthStore.getState().error).toBeNull();
  });

  it('sets isLoading to false on login', () => {
    useAuthStore.getState().setLoading(true);
    useAuthStore.getState().login(mockAuthUser, 'tok', 'ref');

    expect(useAuthStore.getState().isLoading).toBe(false);
  });
});

describe('authStore — logout action', () => {
  it('clears user, tokens, and referralCode on logout', () => {
    useAuthStore.getState().login(mockAuthUser, 'tok_abc', 'ref_xyz');
    useAuthStore.getState().setReferralCode('REF123');

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.refreshToken).toBeNull();
    expect(state.referralCode).toBeNull();
  });

  it('resets error to null on logout', () => {
    useAuthStore.getState().setError('some error');
    useAuthStore.getState().logout();

    expect(useAuthStore.getState().error).toBeNull();
  });
});

describe('authStore — error actions', () => {
  it('setError stores the error message', () => {
    useAuthStore.getState().setError('INVALID_CREDENTIALS');
    expect(selectAuthError(useAuthStore.getState())).toBe('INVALID_CREDENTIALS');
  });

  it('clearError resets error to null', () => {
    useAuthStore.getState().setError('some error');
    useAuthStore.getState().clearError();
    expect(selectAuthError(useAuthStore.getState())).toBeNull();
  });
});

describe('authStore — selectors', () => {
  it('selectIsAuthenticated returns false when user is null', () => {
    expect(selectIsAuthenticated(useAuthStore.getState())).toBe(false);
  });

  it('selectIsAuthenticated returns false when token is null even if user is set', () => {
    useAuthStore.setState({ user: mockAuthUser, token: null });
    expect(selectIsAuthenticated(useAuthStore.getState())).toBe(false);
  });

  it('selectIsAuthenticated returns true after login', () => {
    useAuthStore.getState().login(mockAuthUser, 'tok_abc', 'ref_xyz');
    expect(selectIsAuthenticated(useAuthStore.getState())).toBe(true);
  });

  it('selectIsAuthenticated returns false after logout', () => {
    useAuthStore.getState().login(mockAuthUser, 'tok_abc', 'ref_xyz');
    useAuthStore.getState().logout();
    expect(selectIsAuthenticated(useAuthStore.getState())).toBe(false);
  });

  it('selectUser returns the logged-in user', () => {
    useAuthStore.getState().login(mockAuthUser, 'tok', 'ref');
    expect(selectUser(useAuthStore.getState())).toEqual(mockAuthUser);
  });

  it('selectToken returns the current token', () => {
    useAuthStore.getState().login(mockAuthUser, 'my-token', 'my-refresh');
    expect(selectToken(useAuthStore.getState())).toBe('my-token');
  });
});
