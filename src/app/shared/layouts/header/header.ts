import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AsyncPipe, DatePipe, NgForOf, NgIf } from '@angular/common';
import { Subject, map, takeUntil } from 'rxjs';
import { WalletConnectComponent } from '../../components/wallet-connect/wallet-connect';
import { AppState } from '../../../core/store/app.state';
import {
  LucideAngularModule,
  Droplets,
  Bell,
  Sun,
  Moon,
  Menu,
  CircleCheck,
  CircleX,
  Info,
  TriangleAlert,
} from 'lucide-angular';
import {
  toggleSidebar,
  setDarkMode,
  markNotificationsRead,
} from '../../../core/store/ui/ui.actions';
import {
  selectIsDarkMode,
  selectNotifications,
  selectUnreadNotificationCount,
} from '../../../core/store/ui/ui.selectors';
import { selectWalletAddress } from '../../../core/store/wallet/wallet.selectors';
import { ClickOutsideDirective } from '../../directives/click-outside.directive';
import { Notification } from '../../../core/store/ui/ui.reducer';
import * as AuthActions from '../../../core/store/auth/auth.actions';
import * as WalletActions from '../../../core/store/wallet/wallet.actions';
import { WalletService } from '../../../core/services/wallet.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterLink,
    AsyncPipe,
    DatePipe,
    NgIf,
    NgForOf,
    WalletConnectComponent,
    LucideAngularModule,
    ClickOutsideDirective,
  ],
  template: `
    <header
      class="h-16 bg-white dark:bg-dark-bg-lighter border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 lg:px-6"
    >
      <div class="flex items-center gap-4">
        <button
          (click)="toggleSidebar()"
          class="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          aria-label="Toggle sidebar"
        >
          <lucide-angular
            [img]="MenuIcon"
            class="w-5 h-5 text-slate-600 dark:text-slate-400"
          ></lucide-angular>
        </button>
        <a routerLink="/dashboard" class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-stellar-blue flex items-center justify-center">
            <lucide-angular [img]="DropletsIcon" class="w-4 h-4 text-white"></lucide-angular>
          </div>
          <span class="font-bold text-lg text-slate-900 dark:text-white hidden sm:inline"
            >Water Credits</span
          >
        </a>
      </div>

      <div class="flex items-center gap-3">
        <button
          (click)="toggleDarkMode()"
          class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          [attr.aria-label]="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
        >
          <lucide-angular
            [img]="isDarkMode ? SunIcon : MoonIcon"
            class="w-4 h-4 text-slate-500"
          ></lucide-angular>
        </button>
        <div class="relative" appClickOutside (appClickOutside)="closeNotifications()">
          <button
            (click)="toggleNotifications()"
            class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 relative"
            aria-label="Notifications"
            [attr.aria-expanded]="notificationsOpen"
          >
            <lucide-angular [img]="BellIcon" class="w-4 h-4 text-slate-500"></lucide-angular>
            <span
              *ngIf="(unreadCount$ | async) ?? 0 > 0"
              class="absolute top-0 right-0 min-w-4 h-4 px-1 bg-retirement-red text-white text-[10px] font-bold rounded-full flex items-center justify-center"
              aria-hidden="true"
            >
              {{ unreadCount$ | async }}
            </span>
          </button>

          <div
            *ngIf="notificationsOpen"
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
                  <p class="text-sm text-slate-900 dark:text-white truncate">
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
          </div>
        </div>
        <app-wallet-connect
          [connected]="!!(walletAddress$ | async)"
          [address]="(walletAddress$ | async) || ''"
          (connect)="connectWallet()"
          (disconnect)="disconnectWallet()"
        />
      </div>
    </header>
  `,
})
export class HeaderComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store<AppState>);
  private readonly walletService = inject(WalletService);

  /** The connected wallet address from the store (wallet slice). */
  protected readonly walletAddress$ = this.store.select(selectWalletAddress);
  protected readonly unreadCount$ = this.store.select(selectUnreadNotificationCount);
  protected readonly notifications$ = this.store
    .select(selectNotifications)
    .pipe(map((notifications) => notifications.slice(0, 5)));

  protected notificationsOpen = false;

  protected isDarkMode = true;
  protected readonly MenuIcon = Menu;
  protected readonly DropletsIcon = Droplets;
  protected readonly BellIcon = Bell;
  protected readonly SunIcon = Sun;
  protected readonly MoonIcon = Moon;
  protected readonly SuccessIcon = CircleCheck;
  protected readonly ErrorIcon = CircleX;
  protected readonly InfoIcon = Info;
  protected readonly WarningIcon = TriangleAlert;

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.store
      .select(selectIsDarkMode)
      .pipe(takeUntil(this.destroy$))
      .subscribe((dark) => {
        this.isDarkMode = dark;
        document.documentElement.classList.toggle('dark', dark);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleSidebar(): void {
    this.store.dispatch(toggleSidebar());
  }

  async connectWallet(): Promise<void> {
    const address = await this.walletService.connect();
    if (address) {
      this.store.dispatch(WalletActions.connectWalletSuccess({ address }));
      this.store.dispatch(AuthActions.login());
    }
  }

  disconnectWallet(): void {
    this.store.dispatch(AuthActions.logout());
  }

  toggleDarkMode(): void {
    this.store.dispatch(setDarkMode({ isDark: !this.isDarkMode }));
  }

  toggleNotifications(): void {
    this.notificationsOpen = !this.notificationsOpen;
  }

  closeNotifications(): void {
    this.notificationsOpen = false;
  }

  markAllRead(): void {
    this.store.dispatch(markNotificationsRead());
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
