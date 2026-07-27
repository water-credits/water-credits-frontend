import { Injectable, inject } from '@angular/core';
import { LoggingService } from './logging.service';
import { BehaviorSubject } from 'rxjs';

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
  private loggingService = inject(LoggingService);

  showSuccess(message: string): void {
    this.loggingService.info(`[Toast Success]: ${message}`);
    // existing toast implementation...
  }

  showWarning(message: string): void {
    this.loggingService.warn(`[Toast Warning]: ${message}`);
    // existing toast implementation...
  }

  showError(message: string, error?: unknown): void {
    this.loggingService.error(`[Toast Error]: ${message}`, undefined, error);
    // existing toast implementation...
  }
  
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<ToastNotification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  constructor() {}

  show(notification: Omit<ToastNotification, 'id'>) {
    const id = Math.random().toString(36).substring(2, 11);
    const newNotification = { ...notification, id };

    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([...current, newNotification]);

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
}
