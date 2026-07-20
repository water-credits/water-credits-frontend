import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { addNotification, removeNotification } from '../store/ui/ui.actions';
import { AppState } from '../store/app.state';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * NotificationService — the single entry point for showing user feedback.
 *
 * All callers (effects, components) simply call `success()`, `error()`, etc.
 * The service dispatches `addNotification` to the UI store slice, which:
 *   - appends the item to `UIState.notifications` (capped at 50)
 *   - increments `unreadNotificationCount`
 *
 * ToastContainerComponent subscribes to the store and handles rendering +
 * auto-dismissal via `removeNotification`.  The service itself starts the
 * auto-dismiss timer so that even if the toast component is not yet in the
 * DOM the removal action fires correctly.
 *
 * Duration rules:
 *   - success / info / warning: 4 000 ms default
 *   - error: 0 (persists until the user dismisses)
 *   - callers may override via the optional `duration` parameter
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly store = inject(Store<AppState>);

  // ── Public helpers ──────────────────────────────────────────────────────────

  success(title: string, message: string, duration?: number): void {
    this.show('success', title, message, duration ?? 4000);
  }

  error(title: string, message: string, duration?: number): void {
    // Errors default to 0 (persistent) — caller may pass a positive ms to override
    this.show('error', title, message, duration ?? 0);
  }

  info(title: string, message: string, duration?: number): void {
    this.show('info', title, message, duration ?? 4000);
  }

  warning(title: string, message: string, duration?: number): void {
    this.show('warning', title, message, duration ?? 4000);
  }

  /**
   * @deprecated Use `success()`, `error()`, `info()`, or `warning()` directly.
   * Kept for backward-compat with any call-sites that use the old `show()` API.
   */
  show(
    type: NotificationType,
    title: string,
    message: string,
    duration?: number,
  ): void {
    this.store.dispatch(addNotification({ notification: { type, title, message, duration } }));
  }

  /** Programmatically dismiss a specific notification by ID. */
  dismiss(id: string): void {
    this.store.dispatch(removeNotification({ id }));
  }
}
