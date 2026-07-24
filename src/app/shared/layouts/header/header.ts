import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AsyncPipe } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { WalletConnectComponent } from '../../components/wallet-connect/wallet-connect';
import { AppState } from '../../../core/store/app.state';
import { LucideAngularModule, Droplets, Bell, Sun, Moon, Menu, X } from 'lucide-angular';
import { setSidebarMobileOpen, setDarkMode } from '../../../core/store/ui/ui.actions';
import { selectIsDarkMode, selectSidebarMobileOpen } from '../../../core/store/ui/ui.selectors';
import { selectWalletAddress } from '../../../core/store/wallet/wallet.selectors';
import * as AuthActions from '../../../core/store/auth/auth.actions';
import * as WalletActions from '../../../core/store/wallet/wallet.actions';
import { WalletService } from '../../../core/services/wallet.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, AsyncPipe, WalletConnectComponent, LucideAngularModule],
  template: `
    <header
      class="h-16 bg-white dark:bg-dark-bg-lighter border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-3 sm:px-4 lg:px-6 sticky top-0 z-30"
    >
      <div class="flex items-center gap-2 sm:gap-4 min-w-0">
        <!-- Mobile hamburger -->
        <button
          (click)="toggleMobileSidebar()"
          class="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 touch-manipulation"
          [attr.aria-label]="(sidebarMobileOpen$ | async) ? 'Close navigation menu' : 'Open navigation menu'"
          [attr.aria-expanded]="sidebarMobileOpen$ | async"
        >
          @if (sidebarMobileOpen$ | async) {
            <lucide-angular
              [img]="XIcon"
              class="w-5 h-5 text-slate-600 dark:text-slate-400"
            ></lucide-angular>
          } @else {
            <lucide-angular
              [img]="MenuIcon"
              class="w-5 h-5 text-slate-600 dark:text-slate-400"
            ></lucide-angular>
          }
        </button>

        <a routerLink="/dashboard" class="flex items-center gap-2 min-w-0">
          <div class="w-8 h-8 rounded-lg bg-stellar-blue flex items-center justify-center shrink-0">
            <lucide-angular [img]="DropletsIcon" class="w-4 h-4 text-white"></lucide-angular>
          </div>
          <span class="font-bold text-base sm:text-lg text-slate-900 dark:text-white truncate"
            >Water Credits</span
          >
        </a>
      </div>

      <div class="flex items-center gap-1 sm:gap-2">
        <button
          (click)="toggleDarkMode()"
          class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 touch-manipulation"
          [attr.aria-label]="isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'"
        >
          <lucide-angular
            [img]="isDarkMode ? SunIcon : MoonIcon"
            class="w-4 h-4 text-slate-500"
          ></lucide-angular>
        </button>
        <button
          class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 relative touch-manipulation"
          aria-label="Notifications"
        >
          <lucide-angular [img]="BellIcon" class="w-4 h-4 text-slate-500"></lucide-angular>
          <span
            class="absolute top-1.5 right-1.5 w-2 h-2 bg-retirement-red rounded-full"
            aria-hidden="true"
          ></span>
        </button>
        <app-wallet-connect
          [connected]="!!(walletAddress$ | async)"
          [address]="(walletAddress$ | async) || ''"
          (connect)="connectWallet()"
          (disconnect)="disconnectWallet()"
        />
      </div>
    </header>
  `,
  styles: [
    `
      :host {
        display: contents;
      }
    `,
  ],
})
export class HeaderComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store<AppState>);
  private readonly walletService = inject(WalletService);

  protected readonly walletAddress$ = this.store.select(selectWalletAddress);
  protected readonly sidebarMobileOpen$ = this.store.select(selectSidebarMobileOpen);

  protected isDarkMode = true;
  protected readonly MenuIcon = Menu;
  protected readonly XIcon = X;
  protected readonly DropletsIcon = Droplets;
  protected readonly BellIcon = Bell;
  protected readonly SunIcon = Sun;
  protected readonly MoonIcon = Moon;

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

  toggleMobileSidebar(): void {
    this.store.dispatch(setSidebarMobileOpen({ open: true }));
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
}