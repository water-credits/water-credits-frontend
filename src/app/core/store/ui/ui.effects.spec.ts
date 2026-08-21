import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Subject, firstValueFrom } from 'rxjs';
import { Action } from '@ngrx/store';

import { UIEffects } from './ui.effects';
import { NotificationService, ToastNotification } from '../../services/notification.service';
import * as UIActions from './ui.actions';

describe('UIEffects', () => {
  let effects: UIEffects;
  let actions$: Subject<Action>;
  let notificationEvents$: Subject<ToastNotification>;

  const notificationServiceMock = {
    events$: undefined as unknown as Subject<ToastNotification>,
    updateEmailOptIn: vi.fn(),
  };

  beforeEach(() => {
    actions$ = new Subject<Action>();
    notificationEvents$ = new Subject<ToastNotification>();
    notificationServiceMock.events$ = notificationEvents$;
    notificationServiceMock.updateEmailOptIn.mockReturnValue(new Subject());

    TestBed.configureTestingModule({
      providers: [
        UIEffects,
        provideMockActions(() => actions$),
        { provide: NotificationService, useValue: notificationServiceMock },
      ],
    });

    effects = TestBed.inject(UIEffects);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('bridgeNotificationEvents$', () => {
    it('maps a toast event into an addNotification action for the persistent store', async () => {
      const resultPromise = firstValueFrom(effects.bridgeNotificationEvents$);

      notificationEvents$.next({
        id: 'toast-1',
        type: 'success',
        title: 'Retirement confirmed',
        message: 'Your retirement was confirmed on-chain.',
      });

      const result = await resultPromise;

      expect(result).toEqual(
        UIActions.addNotification({
          id: 'toast-1',
          notificationType: 'success',
          title: 'Retirement confirmed',
          message: 'Your retirement was confirmed on-chain.',
        }),
      );
    });

    it('emits one action per toast event without merging or dropping them', async () => {
      const emitted: Action[] = [];
      effects.bridgeNotificationEvents$.subscribe((action) => emitted.push(action));

      notificationEvents$.next({ id: 't-1', type: 'info', title: 'A', message: 'a' });
      notificationEvents$.next({ id: 't-2', type: 'warning', title: 'B', message: 'b' });

      expect(emitted).toEqual([
        UIActions.addNotification({
          id: 't-1',
          notificationType: 'info',
          title: 'A',
          message: 'a',
        }),
        UIActions.addNotification({
          id: 't-2',
          notificationType: 'warning',
          title: 'B',
          message: 'b',
        }),
      ]);
    });
  });

  describe('persistEmailOptIn$', () => {
    it('calls NotificationService.updateEmailOptIn when the preference changes', () => {
      effects.persistEmailOptIn$.subscribe();

      actions$.next(UIActions.setEmailNotificationsOptIn({ optIn: true }));

      expect(notificationServiceMock.updateEmailOptIn).toHaveBeenCalledWith(true);
    });

    it('calls the service again for each subsequent preference change', () => {
      effects.persistEmailOptIn$.subscribe();

      actions$.next(UIActions.setEmailNotificationsOptIn({ optIn: true }));
      actions$.next(UIActions.setEmailNotificationsOptIn({ optIn: false }));

      expect(notificationServiceMock.updateEmailOptIn).toHaveBeenCalledTimes(2);
      expect(notificationServiceMock.updateEmailOptIn).toHaveBeenNthCalledWith(1, true);
      expect(notificationServiceMock.updateEmailOptIn).toHaveBeenNthCalledWith(2, false);
    });
  });
});
