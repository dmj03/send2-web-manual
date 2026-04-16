import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  countryCode: string | null;
  profileImageUrl: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  firestoreUid: string | null;
  socialProvider: 'google' | 'facebook' | 'apple' | null;
  createdAt: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isProfileImageUpdating: boolean;
  referralCode: string | null;
  error: string | null;
}

export interface AuthActions {
  login: (user: AuthUser, token: string, refreshToken: string) => void;
  logout: () => void;
  setUser: (user: AuthUser | null) => void;
  setToken: (token: string, refreshToken: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setProfileImageUpdating: (updating: boolean) => void;
  setReferralCode: (code: string | null) => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isLoading: false,
  isProfileImageUpdating: false,
  referralCode: null,
  error: null,
};

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        login: (user, token, refreshToken) =>
          set(
            { user, token, refreshToken, error: null, isLoading: false },
            false,
            'auth/login',
          ),

        logout: () =>
          set(
            {
              user: null,
              token: null,
              refreshToken: null,
              referralCode: null,
              error: null,
              isLoading: false,
            },
            false,
            'auth/logout',
          ),

        setUser: (user) => set({ user }, false, 'auth/setUser'),

        setToken: (token, refreshToken) =>
          set({ token, refreshToken }, false, 'auth/setToken'),

        setLoading: (isLoading) => set({ isLoading }, false, 'auth/setLoading'),

        setError: (error) => set({ error }, false, 'auth/setError'),

        clearError: () => set({ error: null }, false, 'auth/clearError'),

        setProfileImageUpdating: (isProfileImageUpdating) =>
          set({ isProfileImageUpdating }, false, 'auth/setProfileImageUpdating'),

        setReferralCode: (referralCode) =>
          set({ referralCode }, false, 'auth/setReferralCode'),
      }),
      {
        name: 'send2-auth',
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          refreshToken: state.refreshToken,
          referralCode: state.referralCode,
        }),
      },
    ),
    { name: 'AuthStore', enabled: process.env.NODE_ENV === 'development' },
  ),
);

// Typed selectors
export const selectUser = (state: AuthStore) => state.user;
export const selectIsAuthenticated = (state: AuthStore) => state.user !== null && state.token !== null;
export const selectAuthError = (state: AuthStore) => state.error;
export const selectToken = (state: AuthStore) => state.token;
