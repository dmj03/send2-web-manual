import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'info' | 'alert' | 'promo' | 'system';
  isRead: boolean;
  deepLink: string | null;
  createdAt: string;
}

export interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
}

export interface NotificationActions {
  setNotifications: (notifications: AppNotification[]) => void;
  addNotification: (notification: AppNotification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  setUnreadCount: (count: number) => void;
  setLoading: (loading: boolean) => void;
}

type NotificationStore = NotificationState & NotificationActions;

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
};

export const useNotificationStore = create<NotificationStore>()(
  devtools(
    immer((set) => ({
      ...initialState,

      setNotifications: (notifications) =>
        set(
          (state) => {
            state.notifications = notifications;
            state.unreadCount = notifications.filter((n: AppNotification) => !n.isRead).length;
            state.isLoading = false;
          },
          false,
          'notification/setNotifications',
        ),

      addNotification: (notification) =>
        set(
          (state) => {
            state.notifications.unshift(notification);
            if (!notification.isRead) {
              state.unreadCount += 1;
            }
          },
          false,
          'notification/addNotification',
        ),

      markRead: (id) =>
        set(
          (state) => {
            const notif = state.notifications.find((n: AppNotification) => n.id === id);
            if (notif && !notif.isRead) {
              notif.isRead = true;
              state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
          },
          false,
          'notification/markRead',
        ),

      markAllRead: () =>
        set(
          (state) => {
            state.notifications.forEach((n: AppNotification) => {
              n.isRead = true;
            });
            state.unreadCount = 0;
          },
          false,
          'notification/markAllRead',
        ),

      setUnreadCount: (unreadCount) =>
        set((state) => {
          state.unreadCount = unreadCount;
        }, false, 'notification/setUnreadCount'),

      setLoading: (isLoading) =>
        set((state) => {
          state.isLoading = isLoading;
        }, false, 'notification/setLoading'),
    })),
    { name: 'NotificationStore', enabled: process.env.NODE_ENV === 'development' },
  ),
);

// Typed selectors
export const selectNotifications = (state: NotificationStore) => state.notifications;
export const selectUnreadCount = (state: NotificationStore) => state.unreadCount;
export const selectUnreadNotifications = (state: NotificationStore) =>
  state.notifications.filter((n: AppNotification) => !n.isRead);
