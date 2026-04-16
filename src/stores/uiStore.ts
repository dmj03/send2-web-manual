import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export type Theme = 'light' | 'dark' | 'system';

export interface UiState {
  isSidebarOpen: boolean;
  isMobileSidebarOpen: boolean;
  theme: Theme;
  toasts: Toast[];
  activeModal: string | null;
  globalLoading: boolean;
  cmsLoading: boolean;
  locale: string;
  scrollY: number;
  showBackButton: boolean;
  featureFlags: Record<string, boolean>;
  appSettings: Record<string, unknown>;
}

export interface UiActions {
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
  setTheme: (theme: Theme) => void;
  pushToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  openModal: (name: string) => void;
  closeModal: () => void;
  setGlobalLoading: (loading: boolean) => void;
  setCmsLoading: (loading: boolean) => void;
  setLocale: (locale: string) => void;
  setScrollY: (y: number) => void;
  setShowBackButton: (show: boolean) => void;
  setFeatureFlags: (flags: Record<string, boolean>) => void;
  setAppSettings: (settings: Record<string, unknown>) => void;
}

type UiStore = UiState & UiActions;

let toastIdCounter = 0;

const initialState: UiState = {
  isSidebarOpen: true,
  isMobileSidebarOpen: false,
  theme: 'system',
  toasts: [],
  activeModal: null,
  globalLoading: false,
  cmsLoading: false,
  locale: 'en',
  scrollY: 0,
  showBackButton: false,
  featureFlags: {},
  appSettings: {},
};

export const useUiStore = create<UiStore>()(
  devtools(
    persist(
      immer((set) => ({
        ...initialState,

        openSidebar: () =>
          set((state) => {
            state.isSidebarOpen = true;
          }, false, 'ui/openSidebar'),

        closeSidebar: () =>
          set((state) => {
            state.isSidebarOpen = false;
          }, false, 'ui/closeSidebar'),

        toggleSidebar: () =>
          set((state) => {
            state.isSidebarOpen = !state.isSidebarOpen;
          }, false, 'ui/toggleSidebar'),

        openMobileSidebar: () =>
          set((state) => {
            state.isMobileSidebarOpen = true;
          }, false, 'ui/openMobileSidebar'),

        closeMobileSidebar: () =>
          set((state) => {
            state.isMobileSidebarOpen = false;
          }, false, 'ui/closeMobileSidebar'),

        setTheme: (theme) =>
          set((state) => {
            state.theme = theme;
          }, false, 'ui/setTheme'),

        pushToast: (toast) =>
          set(
            (state) => {
              toastIdCounter += 1;
              state.toasts.push({ ...toast, id: String(toastIdCounter) });
            },
            false,
            'ui/pushToast',
          ),

        dismissToast: (id) =>
          set(
            (state) => {
              state.toasts = state.toasts.filter((t: Toast) => t.id !== id);
            },
            false,
            'ui/dismissToast',
          ),

        openModal: (name) =>
          set((state) => {
            state.activeModal = name;
          }, false, 'ui/openModal'),

        closeModal: () =>
          set((state) => {
            state.activeModal = null;
          }, false, 'ui/closeModal'),

        setGlobalLoading: (globalLoading) =>
          set((state) => {
            state.globalLoading = globalLoading;
          }, false, 'ui/setGlobalLoading'),

        setCmsLoading: (cmsLoading) =>
          set((state) => {
            state.cmsLoading = cmsLoading;
          }, false, 'ui/setCmsLoading'),

        setLocale: (locale) =>
          set((state) => {
            state.locale = locale;
          }, false, 'ui/setLocale'),

        setScrollY: (scrollY) =>
          set((state) => {
            state.scrollY = scrollY;
          }, false, 'ui/setScrollY'),

        setShowBackButton: (showBackButton) =>
          set((state) => {
            state.showBackButton = showBackButton;
          }, false, 'ui/setShowBackButton'),

        setFeatureFlags: (featureFlags) =>
          set((state) => {
            state.featureFlags = featureFlags;
          }, false, 'ui/setFeatureFlags'),

        setAppSettings: (appSettings) =>
          set((state) => {
            state.appSettings = appSettings;
          }, false, 'ui/setAppSettings'),
      })),
      {
        name: 'send2-ui',
        partialize: (state) => ({
          theme: state.theme,
          locale: state.locale,
          isSidebarOpen: state.isSidebarOpen,
        }),
      },
    ),
    { name: 'UiStore', enabled: process.env.NODE_ENV === 'development' },
  ),
);

// Typed selectors
export const selectTheme = (state: UiStore) => state.theme;
export const selectToasts = (state: UiStore) => state.toasts;
export const selectActiveModal = (state: UiStore) => state.activeModal;
export const selectGlobalLoading = (state: UiStore) => state.globalLoading;
export const selectLocale = (state: UiStore) => state.locale;
