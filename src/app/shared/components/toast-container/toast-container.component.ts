import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';
import {
  trigger,
  transition,
  style,
  animate,
  query,
  animateChild,
  group,
} from '@angular/animations';
import {
  LucideAngularModule,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-angular';
import { AppState } from '../../../core/store/app.state';
import { AppNotification } from '../../../core/store/ui/ui.reducer';
import { selectNotifications } from '../../../core/store/ui/ui.selectors';
import { removeNotification } from '../../../core/store/ui/ui.actions';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('toastEnterLeave', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(110%)' }),
        animate('220ms cubic-bezier(0.4,0,0.2,1)', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
      transition(':leave', [
        animate('180ms cubic-bezier(0.4,0,0.2,1)', style({ opacity: 0, transform: 'translateX(110%)' })),
      ]),
    ]),
    trigger('list', [
      transition('* => *', [
        query(':enter, :leave', animateChild(), { optional: true }),
      ]),
    ]),
  ],
  template: `
    <div
      aria-live="polite"
      aria-atomic="false"
      class="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none"
      [@list]="toasts.length"
    >
      <div
        *ngFor="let toast of toasts; trackBy: trackById"
        [@toastEnterLeave]
        class="pointer-events-auto flex items-start gap-3 rounded-xl shadow-lg shadow-black/10 px-4 py-3 border backdrop-blur-sm"
        [ngClass]="containerClass(toast.type)"
        role="alert"
      >
        <!-- Icon -->
        <div class="flex-shrink-0 mt-0.5">
          <lucide-angular
            *ngIf="toast.type === 'success'"
            [img]="CheckCircle2Icon"
            class="w-4 h-4 text-green-500"
          ></lucide-angular>
          <lucide-angular
            *ngIf="toast.type === 'error'"
            [img]="XCircleIcon"
            class="w-4 h-4 text-red-500"
          ></lucide-angular>
          <lucide-angular
            *ngIf="toast.type === 'warning'"
            [img]="AlertTriangleIcon"
            class="w-4 h-4 text-amber-500"
          ></lucide-angular>
          <lucide-angular
            *ngIf="toast.type === 'info'"
            [img]="InfoIcon"
            class="w-4 h-4 text-stellar-blue"
          ></lucide-angular>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold" [ngClass]="titleClass(toast.type)">{{ toast.title }}</p>
          <p class="text-xs mt-0.5 text-slate-500 dark:text-slate-400 leading-relaxed">
            {{ toast.message }}
          </p>
        </div>

        <!-- Dismiss -->
        <button
          (click)="dismiss(toast.id)"
          class="flex-shrink-0 p-1 rounded-lg opacity-50 hover:opacity-100 transition-opacity"
          [attr.aria-label]="'Dismiss ' + toast.title"
        >
          <lucide-angular [img]="XIcon" class="w-3.5 h-3.5 text-slate-500"></lucide-angular>
        </button>
      </div>
    </div>
  `,
})
export class ToastContainerComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store<AppState>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  protected toasts: AppNotification[] = [];

  // Timers keyed by notification id — cleared on manual dismiss
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  protected readonly CheckCircle2Icon = CheckCircle2;
  protected readonly XCircleIcon = XCircle;
  protected readonly AlertTriangleIcon = AlertTriangle;
  protected readonly InfoIcon = Info;
  protected readonly XIcon = X;

  ngOnInit(): void {
    this.store
      .select(selectNotifications)
      .pipe(takeUntil(this.destroy$))
      .subscribe((notifications) => {
        // Find newly added toasts (ones not yet in our local list)
        const currentIds = new Set(this.toasts.map((t) => t.id));
        const newItems = notifications.filter((n) => !currentIds.has(n.id));

        this.toasts = notifications;
        this.cdr.markForCheck();

        // Start auto-dismiss timers for new items with a positive duration
        for (const item of newItems) {
          if (item.duration && item.duration > 0 && !this.timers.has(item.id)) {
            const timer = setTimeout(() => {
              this.dismiss(item.id);
              this.timers.delete(item.id);
            }, item.duration);
            this.timers.set(item.id, timer);
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.timers.forEach((t) => clearTimeout(t));
    this.timers.clear();
  }

  dismiss(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.store.dispatch(removeNotification({ id }));
  }

  trackById(_: number, item: AppNotification): string {
    return item.id;
  }

  containerClass(type: AppNotification['type']): Record<string, boolean> {
    return {
      'bg-white/95 dark:bg-dark-bg-lighter/95 border-green-200 dark:border-green-800/40':
        type === 'success',
      'bg-white/95 dark:bg-dark-bg-lighter/95 border-red-200 dark:border-red-800/40':
        type === 'error',
      'bg-white/95 dark:bg-dark-bg-lighter/95 border-amber-200 dark:border-amber-800/40':
        type === 'warning',
      'bg-white/95 dark:bg-dark-bg-lighter/95 border-blue-200 dark:border-blue-800/40':
        type === 'info',
    };
  }

  titleClass(type: AppNotification['type']): Record<string, boolean> {
    return {
      'text-green-700 dark:text-green-400': type === 'success',
      'text-red-700 dark:text-red-400': type === 'error',
      'text-amber-700 dark:text-amber-400': type === 'warning',
      'text-blue-700 dark:text-blue-400': type === 'info',
    };
  }
}
