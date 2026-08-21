import { uiReducer, initialState } from './ui.reducer';
import * as UIActions from './ui.actions';

describe('uiReducer', () => {
  describe('addNotification', () => {
    it('adds a new notification as unread and increments the unread count', () => {
      const state = uiReducer(
        initialState,
        UIActions.addNotification({
          id: 'n-1',
          notificationType: 'success',
          title: 'Retirement confirmed',
          message: 'msg',
        }),
      );

      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0]).toMatchObject({ id: 'n-1', read: false });
      expect(state.unreadNotificationCount).toBe(1);
    });

    it('ignores a duplicate id instead of double-counting', () => {
      const once = uiReducer(
        initialState,
        UIActions.addNotification({
          id: 'n-1',
          notificationType: 'info',
          title: 'A',
          message: 'a',
        }),
      );
      const twice = uiReducer(
        once,
        UIActions.addNotification({
          id: 'n-1',
          notificationType: 'info',
          title: 'A',
          message: 'a',
        }),
      );

      expect(twice.notifications).toHaveLength(1);
      expect(twice.unreadNotificationCount).toBe(1);
    });
  });

  describe('markNotificationsRead', () => {
    it('marks every notification read and resets the unread count', () => {
      const withNotification = uiReducer(
        initialState,
        UIActions.addNotification({
          id: 'n-1',
          notificationType: 'warning',
          title: 'A',
          message: 'a',
        }),
      );

      const state = uiReducer(withNotification, UIActions.markNotificationsRead());

      expect(state.unreadNotificationCount).toBe(0);
      expect(state.notifications.every((n) => n.read)).toBe(true);
    });
  });

  describe('setEmailNotificationsOptIn', () => {
    it('updates the email opt-in flag', () => {
      const state = uiReducer(initialState, UIActions.setEmailNotificationsOptIn({ optIn: true }));

      expect(state.emailNotificationsOptIn).toBe(true);
    });
  });
});
