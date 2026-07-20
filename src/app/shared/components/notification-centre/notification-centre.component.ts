import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Output,
  EventEmitter,
} from '@angular/core';
import { NgFor, NgIf, NgClass, DatePipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';
import {
  LucideAngularModule,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
  Bell,
  Trash2,
} from 'lucide-angular';
import { AppState } from '../../../core/store/app.state';
import { AppNotification } from '../../../core/store/ui/ui.reducer';
import { selectNotifications } from '../../../core/store/ui/ui.selectors';
import { removeNotification, markNotificationsRead } from '../../../core/store/ui/ui.actions';
import { DateFormatPipe } from '../../pipes/date-format.pipe';

@Component({
  selector: 'app-notification-centre',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, LucideAngularModule, DateFormatPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(100%)' }),
        animate('250ms cubic-bezier(0.4,0,0.2,1)', style({ opacity: 1, transform: 'translateX(0)' })),
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(0.4,0,0.2,1)', style({ opacity: 0, transform: 'translateX(100%)' })),
      ]),
    ]),
    trigger('fade', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('150ms ease', style({ opacity: 0 })),
      ]),
    ]),
  ],
  template: `
    <!-- Backdrop -->
    <div
      [@fade]
      class="fixed inset-0 z-[9998] bg-black/30 backdrop-blur-[1px]"
      (click)="close()"
      aria-hidden="true"
    ></div>

    <!-- Panel -->
    <aside
      [@slideIn]
      class="fixed top-0 right-0 bottom-0 z-[9999] w-full max-w-sm bg-white dark:bg-dark-bg-lighter shadow-2xl flex flex-col"
      role="dialog"
      aria-label="Notification centre"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700"
      >
        <div class="flex items-center gap-2">
          <lucide-angular [img]="BellIcon" class="w-4 h-4 text-slate-500"></lucide-angular>
          <h2 class="text-sm font-semibold text-slate-900 dark:text-white">Notifications</h2>
          <span
            *ngIf="notifications.length > 0"
            class="text-xs text-slate-400 dark:text-slate-500"
          >{{ notifications.length }}</span>
        </div>
        <div class="flex items-center gap-1">
          <button
            *ngIf="notifications.length > 0"
            (click)="clearAll()"
            class="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            aria-label="Clear all notifications"
          >
            <lucide-angular [img]="Trash2Icon" class="w-3.5 h-3.5"></lucide-angular>
          </button>
          <button
            (click)="close()"
            class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Close notification centre"
          >
            <lucide-angular [img]="XIcon" class="w-4 h-4"></lucide-angular>
          </button>
        </div>
      </div>

      <!-- List -->
      <div class="flex-1 overflow-y-auto">
        <!-- Empty state -->
        <div *ngIf="notifications.length === 0" class="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
          <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
            <lucide-angular [img]="BellIcon" class="w-5 h-5 text-slate-300 dark:text-slate-600"></lucide-angular>
          </div>
          <p class="text-sm font-medium text-slate-500 dark:text-slate-400">No notifications yet</p>
          <p class="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Activity from retirement, signing, and sensors will appear here.
          </p>
        </div>

        <!-- Items (newest first) -->
        <ul *ngIf="notifications.length > 0" class="divide-y divide-slate-100 dark:divide-slate-700/50">
          <li
            *ngFor="let n of reversed; trackBy: trackById"
            class="flex items-start gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
            [class.opacity-60]="n.read"
          >
            <!-- Type icon -->
            <div class="flex-shrink-0 mt-0.5">
              <lucide-angular *ngIf="n.type === 'success'" [img]="CheckCircle2Icon" class="w-4 h-4 text-green-500"></lucide-angular>
              <lucide-angular *ngIf="n.type === 'error'" [img]="XCircleIcon" class="w-4 h-4 text-red-500"></lucide-angular>
              <lucide-angular *ngIf="n.type === 'warning'" [img]="AlertTriangleIcon" class="w-4 h-4 text-amber-500"></lucide-angular>
              <lucide-angular *ngIf="n.type === 'info'" [img]="InfoIcon" class="w-4 h-4 text-stellar-blue"></lucide-angular>
            </div>

            <!-- Text -->
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{{ n.title }}</p>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{{ n.message }}</p>
              <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                {{ n.createdAt | dateFormat: 'relative' }}
              </p>
            </div>

            <!-- Dismiss -->
            <button
              (click)="dismiss(n.id)"
              class="flex-shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 text-slate-300 hover:text-slate-500 transition-all"
              [attr.aria-label]="'Dismiss ' + n.title"
            >
              <lucide-angular [img]="XIcon" class="w-3 h-3"></lucide-angular>
            </button>
          </li>
        </ul>
      </div>
    </aside>
  `,
})
export class NotificationCentreComponent implements OnInit, OnDestroy {
  @Output() readonly closed = new EventEmitter<void>();

  private readonly store = inject(Store<AppState>);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

  protected notifications: AppNotification[] = [];

  protected readonly BellIcon = Bell;
  protected readonly CheckCircle2Icon = CheckCircle2;
  protected readonly XCircleIcon = XCircle;
  protected readonly AlertTriangleIcon = AlertTriangle;
  protected readonly InfoIcon = Info;
  protected readonly XIcon = X;
  protected readonly Trash2Icon = Trash2;

  get reversed(): AppNotification[] {
    return [...this.notifications].reverse();
  }

  ngOnInit(): void {
    // Mark all as read as soon as the panel opens
    this.store.dispatch(markNotificationsRead());

    this.store
      .select(selectNotifications)
      .pipe(takeUntil(this.destroy$))
      .subscribe((notifications) => {
        this.notifications = notifications;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  close(): void {
    this.closed.emit();
  }

  dismiss(id: string): void {
    this.store.dispatch(removeNotification({ id }));
  }

  clearAll(): void {
    for (const n of this.notifications) {
      this.store.dispatch(removeNotification({ id: n.id }));
    }
  }

  trackById(_: number, item: AppNotification): string {
    return item.id;
  }
}
