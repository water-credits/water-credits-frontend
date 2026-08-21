import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe, DatePipe, NgForOf, NgIf } from '@angular/common';
import {
  LucideAngularModule,
  Bell,
  CircleCheck,
  CircleX,
  Info,
  TriangleAlert,
} from 'lucide-angular';
import { Store } from '@ngrx/store';

import { AppState } from '../../../core/store/app.state';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';
import { Notification } from '../../../core/store/ui/ui.reducer';
import {
  markNotificationsRead,
  setEmailNotificationsOptIn,
} from '../../../core/store/ui/ui.actions';
import {
  selectEmailNotificationsOptIn,
  selectNotifications,
  selectUnreadNotificationCount,
} from '../../../core/store/ui/ui.selectors';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [AsyncPipe, DatePipe, NgIf, NgForOf, LucideAngularModule, ClickOutsideDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative" appClickOutside (appClickOutside)="close()">
      <button
        (click)="toggle()"
        class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 relative"
        aria-label="Notifications"
        [attr.aria-expanded]="isOpen"
      >
        <lucide-angular [img]="BellIcon" class="w-4 h-4 text-slate-500"></lucide-angular>
        <span
          *ngIf="((unreadCount$ | async) ?? 0) > 0"
          class="absolute top-0 right-0 min-w-4 h-4 px-1 bg-retirement-red text-white text-[10px] font-bold rounded-full flex items-center justify-center"
          aria-hidden="true"
        >
          {{ unreadCount$ | async }}
        </span>
      </button>

      <div
        *ngIf="isOpen"
        class="absolute right-0 top-full mt-2 w-80 max-h-96 bg-white dark:bg-dark-bg-lighter rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 z-50 flex flex-col overflow-hidden"
      >
        <div
          class="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700"
        >
          <h3 class="text-sm font-semibold text-slate-900 dark:text-white">Notifications</h3>
          <button (click)="markAllRead()" class="text-xs text-stellar-blue hover:underline">
            Mark all read
          </button>
        </div>

        <ul class="divide-y divide-slate-100 dark:divide-slate-700 overflow-y-auto">
          <li
            *ngFor="let notification of notifications$ | async"
            class="flex items-start gap-3 px-4 py-3"
          >
            <lucide-angular
              [img]="notificationIcon(notification.notificationType)"
              class="w-4 h-4 mt-0.5 shrink-0 text-slate-500 dark:text-slate-400"
            ></lucide-angular>
            <div class="flex-1 min-w-0">
              <p
                class="text-sm truncate"
                [class.font-semibold]="!notification.read"
                [class.text-slate-900]="!notification.read"
                [class.dark:text-white]="!notification.read"
                [class.text-slate-500]="notification.read"
                [class.dark:text-slate-400]="notification.read"
              >
                {{ notification.title }}
              </p>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {{ notification.timestamp | date: 'short' }}
              </p>
            </div>
            <span
              *ngIf="!notification.read"
              class="w-2 h-2 mt-1.5 shrink-0 bg-retirement-red rounded-full"
              aria-hidden="true"
            ></span>
          </li>
        </ul>

        <p
          *ngIf="(notifications$ | async)?.length === 0"
          class="px-4 py-6 text-sm text-slate-500 dark:text-slate-400 text-center"
        >
          You have no notifications
        </p>

        <label
          class="flex items-center gap-2 px-4 py-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 cursor-pointer"
        >
          <input
            type="checkbox"
            class="rounded border-slate-300 dark:border-slate-600 text-stellar-blue focus:ring-stellar-blue"
            [checked]="emailOptIn$ | async"
            (change)="toggleEmailOptIn($event)"
          />
          Email me about important notifications
        </label>
      </div>
    </div>
  `,
})
export class NotificationCenterComponent {
  private readonly store = inject(Store<AppState>);

  protected readonly unreadCount$ = this.store.select(selectUnreadNotificationCount);
  protected readonly notifications$ = this.store.select(selectNotifications);
  protected readonly emailOptIn$ = this.store.select(selectEmailNotificationsOptIn);

  protected isOpen = false;

  protected readonly BellIcon = Bell;
  protected readonly SuccessIcon = CircleCheck;
  protected readonly ErrorIcon = CircleX;
  protected readonly InfoIcon = Info;
  protected readonly WarningIcon = TriangleAlert;

  toggle(): void {
    const opening = !this.isOpen;
    this.isOpen = opening;
    if (opening) {
      this.store.dispatch(markNotificationsRead());
    }
  }

  close(): void {
    this.isOpen = false;
  }

  markAllRead(): void {
    this.store.dispatch(markNotificationsRead());
  }

  toggleEmailOptIn(event: Event): void {
    const optIn = (event.target as HTMLInputElement).checked;
    this.store.dispatch(setEmailNotificationsOptIn({ optIn }));
  }

  notificationIcon(type: Notification['notificationType']): typeof CircleCheck {
    switch (type) {
      case 'success':
        return this.SuccessIcon;
      case 'error':
        return this.ErrorIcon;
      case 'warning':
        return this.WarningIcon;
      default:
        return this.InfoIcon;
    }
  }
}
