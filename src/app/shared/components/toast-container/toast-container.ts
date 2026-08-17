import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { LucideAngularModule, X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-angular';
import {
  NotificationService,
  ToastNotification,
} from '../../../core/services/notification.service';

interface ToastConfig {
  containerClass: string;
  iconClass: string;
  titleClass: string;
  messageClass: string;
  closeClass: string;
  icon: typeof CheckCircle;
  ariaRole: 'alert' | 'status';
  ariaLive: 'assertive' | 'polite';
}

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf, NgClass, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="fixed top-4 right-4 z-[9999] flex flex-col gap-3 w-80 max-w-[calc(100vw-2rem)] pointer-events-none"
      aria-label="Notifications"
    >
      <div
        *ngFor="let toast of notificationService.notifications$ | async; trackBy: trackById"
        [attr.role]="config(toast).ariaRole"
        [attr.aria-live]="config(toast).ariaLive"
        [attr.aria-atomic]="true"
        [ngClass]="config(toast).containerClass"
        class="pointer-events-auto flex items-start gap-3 rounded-lg px-4 py-3 shadow-lg ring-1 ring-black/10 dark:ring-white/10 transition-all duration-300"
      >
        <!-- Type icon -->
        <lucide-angular
          [img]="config(toast).icon"
          [ngClass]="config(toast).iconClass"
          class="w-5 h-5 mt-0.5 flex-shrink-0"
          aria-hidden="true"
        ></lucide-angular>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <p
            *ngIf="toast.title"
            [ngClass]="config(toast).titleClass"
            class="text-sm font-semibold leading-5"
          >
            {{ toast.title }}
          </p>
          <p
            *ngIf="toast.message"
            [ngClass]="config(toast).messageClass"
            class="text-sm leading-5 mt-0.5"
          >
            {{ toast.message }}
          </p>
        </div>

        <!-- Close button (always present; essential when duration === 0) -->
        <button
          type="button"
          (click)="dismiss(toast.id)"
          [ngClass]="config(toast).closeClass"
          class="flex-shrink-0 rounded p-0.5 transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
          aria-label="Dismiss notification"
        >
          <lucide-angular [img]="XIcon" class="w-4 h-4" aria-hidden="true"></lucide-angular>
        </button>
      </div>
    </div>
  `,
})
export class ToastContainerComponent {
  protected readonly notificationService = inject(NotificationService);

  protected readonly XIcon = X;

  private readonly configs: Record<ToastNotification['type'], ToastConfig> = {
    success: {
      containerClass:
        'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700',
      iconClass: 'text-environmental-green',
      titleClass: 'text-emerald-900 dark:text-emerald-100',
      messageClass: 'text-emerald-800 dark:text-emerald-200',
      closeClass: 'text-emerald-600 dark:text-emerald-300 focus-visible:outline-emerald-500',
      icon: CheckCircle,
      ariaRole: 'status',
      ariaLive: 'polite',
    },
    error: {
      containerClass: 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700',
      iconClass: 'text-retirement-red',
      titleClass: 'text-red-900 dark:text-red-100',
      messageClass: 'text-red-800 dark:text-red-200',
      closeClass: 'text-red-600 dark:text-red-300 focus-visible:outline-red-500',
      icon: XCircle,
      ariaRole: 'alert',
      ariaLive: 'assertive',
    },
    warning: {
      containerClass:
        'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700',
      iconClass: 'text-credit-gold',
      titleClass: 'text-amber-900 dark:text-amber-100',
      messageClass: 'text-amber-800 dark:text-amber-200',
      closeClass: 'text-amber-600 dark:text-amber-300 focus-visible:outline-amber-500',
      icon: AlertTriangle,
      ariaRole: 'alert',
      ariaLive: 'assertive',
    },
    info: {
      containerClass:
        'bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700',
      iconClass: 'text-stellar-blue',
      titleClass: 'text-violet-900 dark:text-violet-100',
      messageClass: 'text-violet-800 dark:text-violet-200',
      closeClass: 'text-violet-600 dark:text-violet-300 focus-visible:outline-violet-500',
      icon: Info,
      ariaRole: 'status',
      ariaLive: 'polite',
    },
  };

  config(toast: ToastNotification): ToastConfig {
    return this.configs[toast.type];
  }

  dismiss(id: string): void {
    this.notificationService.remove(id);
  }

  trackById(_index: number, toast: ToastNotification): string {
    return toast.id;
  }
}
