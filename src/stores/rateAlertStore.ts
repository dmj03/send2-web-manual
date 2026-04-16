import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface RateAlert {
  id: string;
  userId: string;
  sendCurrency: string;
  receiveCurrency: string;
  receiveCountry: string;
  targetRate: number;
  currentRate: number | null;
  isActive: boolean;
  isTriggered: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RateAlertState {
  alerts: RateAlert[];
  isLoading: boolean;
  error: string | null;
}

export interface RateAlertActions {
  setAlerts: (alerts: RateAlert[]) => void;
  addAlert: (alert: RateAlert) => void;
  removeAlert: (id: string) => void;
  updateAlert: (id: string, patch: Partial<RateAlert>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

type RateAlertStore = RateAlertState & RateAlertActions;

const initialState: RateAlertState = {
  alerts: [],
  isLoading: false,
  error: null,
};

export const useRateAlertStore = create<RateAlertStore>()(
  devtools(
    immer((set) => ({
      ...initialState,

      setAlerts: (alerts) =>
        set((state) => {
          state.alerts = alerts;
          state.isLoading = false;
        }, false, 'rateAlert/setAlerts'),

      addAlert: (alert) =>
        set((state) => {
          state.alerts.push(alert);
        }, false, 'rateAlert/addAlert'),

      removeAlert: (id) =>
        set(
          (state) => {
            state.alerts = state.alerts.filter((a: RateAlert) => a.id !== id);
          },
          false,
          'rateAlert/removeAlert',
        ),

      updateAlert: (id, patch) =>
        set(
          (state) => {
            const idx = state.alerts.findIndex((a: RateAlert) => a.id === id);
            if (idx !== -1) {
              const item = state.alerts[idx];
              if (item) Object.assign(item, patch);
            }
          },
          false,
          'rateAlert/updateAlert',
        ),

      setLoading: (isLoading) =>
        set((state) => {
          state.isLoading = isLoading;
        }, false, 'rateAlert/setLoading'),

      setError: (error) =>
        set((state) => {
          state.error = error;
          state.isLoading = false;
        }, false, 'rateAlert/setError'),

      clearError: () =>
        set((state) => {
          state.error = null;
        }, false, 'rateAlert/clearError'),
    })),
    { name: 'RateAlertStore', enabled: process.env.NODE_ENV === 'development' },
  ),
);

// Typed selectors
export const selectAlerts = (state: RateAlertStore) => state.alerts;
export const selectActiveAlerts = (state: RateAlertStore) =>
  state.alerts.filter((a) => a.isActive);
export const selectRateAlertError = (state: RateAlertStore) => state.error;
