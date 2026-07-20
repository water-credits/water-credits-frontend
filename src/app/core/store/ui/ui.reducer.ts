import { createReducer, on } from '@ngrx/store';
import * as UIActions from './ui.actions';

const MAX_NOTIFICATIONS = 50;

export interface AppNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration: number;
  createdAt: string;
  read: boolean;
}

export interface UIState {
  sidebarOpen: boolean;
  isDarkMode: boolean;
  isLoading: boolean;
  notifications: AppNotification[];
  unreadNotificationCount: number;
}

export const initialState: UIState = {
  sidebarOpen: true,
  isDarkMode: true, // Default to dark mode
  isLoading: false,
  notifications: [],
  unreadNotificationCount: 0,
};

export const uiReducer = createReducer(
  initialState,
  on(UIActions.toggleSidebar, (state) => ({ ...state, sidebarOpen: !state.sidebarOpen })),
  on(UIActions.setDarkMode, (state, { isDark }) => ({ ...state, isDarkMode: isDark })),
  on(UIActions.setLoading, (state, { isLoading }) => ({ ...state, isLoading })),

  // ── Notifications ─────────────────────────────────────────────────────────────
  on(UIActions.addNotification, (state, { notification }) => {
    const id = Math.random().toString(36).substring(2, 11);
    // errors persist (duration 0 means no auto-dismiss); others default to 4 000 ms
    const duration =
      notification.duration !== undefined
        ? notification.duration
        : notification.type === 'error'
          ? 0
          : 4000;

    const newItem: AppNotification = {
      id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      duration,
      createdAt: new Date().toISOString(),
      read: false,
    };

    const updated = [...state.notifications, newItem];
    // Trim oldest when we exceed the cap
    const trimmed =
      updated.length > MAX_NOTIFICATIONS ? updated.slice(updated.length - MAX_NOTIFICATIONS) : updated;

    return {
      ...state,
      notifications: trimmed,
      unreadNotificationCount: state.unreadNotificationCount + 1,
    };
  }),

  on(UIActions.removeNotification, (state, { id }) => ({
    ...state,
    notifications: state.notifications.filter((n) => n.id !== id),
  })),

  on(UIActions.markNotificationsRead, (state) => ({
    ...state,
    notifications: state.notifications.map((n) => ({ ...n, read: true })),
    unreadNotificationCount: 0,
  })),
);
