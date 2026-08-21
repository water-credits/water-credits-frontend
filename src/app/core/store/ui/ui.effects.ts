import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Actions, createEffect, ofType, OnInitEffects } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { map, switchMap, tap } from 'rxjs/operators';

import { NotificationService } from '../../services/notification.service';
import * as UIActions from './ui.actions';

/** localStorage key for the persisted theme preference. */
const THEME_KEY = 'theme';

/**
 * UIEffects — side effects for UI preferences that must survive page reloads.
 *
 * Responsibilities:
 *   1. On app init (`ngrxOnInitEffects`), read the persisted theme from
 *      localStorage and dispatch `setDarkMode` so the reducer initialises
 *      with the correct value instead of always defaulting to `true`.
 *   2. On every `setDarkMode` dispatch, write the new preference to
 *      localStorage so it persists across sessions.
 *
 * Why here and not in the reducer:
 *   Reading/writing localStorage is a side effect.  Reducers must be pure
 *   functions; performing I/O inside a reducer violates that contract and
 *   makes time-travel debugging unreliable.  Effects are the correct boundary
 *   for any persistent storage interaction.
 *
 * SSR safety: all localStorage access is gated behind `isPlatformBrowser` so
 * that server-side rendering does not throw `localStorage is not defined`.
 */
@Injectable()
export class UIEffects implements OnInitEffects {
  private readonly actions$ = inject(Actions);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly notificationService = inject(NotificationService);

  /**
   * OnInitEffects: called once when the effects class is registered.
   * Reads the persisted theme preference and dispatches `setDarkMode` to
   * seed the store with the correct initial value.
   *
   * If no preference is stored, defaults to dark mode (matching the reducer's
   * existing default) so there is no visible change for first-time visitors.
   */
  ngrxOnInitEffects(): Action {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem(THEME_KEY);
      // Only override the reducer default when a persisted preference exists.
      if (stored !== null) {
        return UIActions.setDarkMode({ isDark: stored === 'dark' });
      }
    }
    // Return a no-op action so NgRx has something to dispatch.
    // setDarkMode with the default value is safe — it matches initialState.
    return UIActions.setDarkMode({ isDark: true });
  }

  /**
   * Persist the theme preference whenever it changes.
   * `dispatch: false` — this effect only produces a side effect (localStorage
   * write) and must not dispatch a new action (which would cause infinite loop).
   */
  persistDarkMode$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(UIActions.setDarkMode),
        tap(({ isDark }) => {
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
          }
        }),
      ),
    { dispatch: false },
  );

  /**
   * Bridge NotificationService's fire-and-forget toast events into the
   * persistent `ui.notifications` store slice.
   *
   * This subscribes to `NotificationService.events$` — a stream separate
   * from `notifications$` (which drives the transient toast list and is
   * consumed independently by ToastContainerComponent). Because both
   * consumers read from the same single emission in `NotificationService.show()`
   * rather than one deriving from the other, the toast list and the
   * notification centre never double-count the same event; the reducer's
   * id-dedupe in `addNotification` is a second safety net against replays.
   */
  bridgeNotificationEvents$ = createEffect(() =>
    this.notificationService.events$.pipe(
      map((toast) =>
        UIActions.addNotification({
          id: toast.id,
          notificationType: toast.type,
          title: toast.title,
          message: toast.message,
        }),
      ),
    ),
  );

  /**
   * Persist the email notification opt-in preference whenever the user
   * changes it. Backed by `NotificationService.updateEmailOptIn`, which is
   * currently a stub — see the TODO on that method for the missing
   * backend endpoint.
   */
  persistEmailOptIn$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(UIActions.setEmailNotificationsOptIn),
        switchMap(({ optIn }) => this.notificationService.updateEmailOptIn(optIn)),
      ),
    { dispatch: false },
  );
}
