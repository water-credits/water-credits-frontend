import { createFeatureSelector, createSelector } from '@ngrx/store';
import { UIState } from './ui.reducer';

export const selectUIState = createFeatureSelector<UIState>('ui');

export const selectSidebarOpen = createSelector(selectUIState, (state) => state.sidebarOpen);
export const selectIsDarkMode = createSelector(selectUIState, (state) => state.isDarkMode);
export const selectIsUILoading = createSelector(selectUIState, (state) => state.isLoading);

// ── Notifications ─────────────────────────────────────────────────────────────

export const selectNotifications = createSelector(selectUIState, (state) => state.notifications);
export const selectUnreadCount = createSelector(
  selectUIState,
  (state) => state.unreadNotificationCount,
);
export const selectToastNotifications = createSelector(
  selectNotifications,
  // Only surface items that haven't been manually dismissed
  (notifications) => notifications.filter((n) => !n.read),
);
