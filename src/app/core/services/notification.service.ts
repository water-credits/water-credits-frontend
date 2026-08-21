import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, delay, of } from 'rxjs';

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<ToastNotification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  /**
   * Fire-and-forget event stream — emits once per notification, independent
   * of the toast display list above. The toast list is transient (entries
   * are removed after their duration elapses); this stream is the single
   * canonical source that UIEffects bridges into the persistent
   * `ui.notifications` store slice, so the notification centre keeps a
   * history that outlives the toast's on-screen lifetime.
   */
  private readonly eventsSubject = new Subject<ToastNotification>();
  public readonly events$ = this.eventsSubject.asObservable();

  constructor() {}

  show(notification: Omit<ToastNotification, 'id'>) {
    const id = Math.random().toString(36).substring(2, 11);
    const newNotification = { ...notification, id };

    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([...current, newNotification]);
    this.eventsSubject.next(newNotification);

    if (notification.duration !== 0) {
      setTimeout(() => {
        this.remove(id);
      }, notification.duration || 5000);
    }
  }

  success(title: string, message: string) {
    this.show({ type: 'success', title, message });
  }

  error(title: string, message: string) {
    this.show({ type: 'error', title, message });
  }

  info(title: string, message: string) {
    this.show({ type: 'info', title, message });
  }

  warning(title: string, message: string) {
    this.show({ type: 'warning', title, message });
  }

  remove(id: string) {
    const current = this.notificationsSubject.value;
    this.notificationsSubject.next(current.filter((n) => n.id !== id));
  }

  /**
   * Persist the user's email notification preference.
   *
   * TODO: no backend endpoint exists yet for notification preferences.
   * This stub simulates a network round-trip so callers (UIEffects) and
   * the UI can integrate against the real contract now; swap the body for
   * an HttpClient call (e.g. `PATCH /users/me/notification-preferences`)
   * once the endpoint ships.
   */
  updateEmailOptIn(optIn: boolean): Observable<boolean> {
    return of(optIn).pipe(delay(300));
  }
}
