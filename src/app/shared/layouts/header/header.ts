import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AsyncPipe } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { WalletConnectComponent } from '../../components/wallet-connect/wallet-connect';
import { AppState } from '../../../core/store/app.state';
import { LucideAngularModule, Droplets, Bell, Sun, Moon, Menu } from 'lucide-angular';
import { toggleSidebar, setDarkMode } from '../../../core/store/ui/ui.actions';
import { selectIsDarkMode } from '../../../core/store/ui/ui.selectors';
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
            aria-hidden="true"
          ></lucide-angular>
        </button>
        <a routerLink="/dashboard" class="flex items-center gap-2" aria-label="Water Credits – go to dashboard">
          <div class="w-8 h-8 rounded-lg bg-stellar-blue flex items-center justify-center" aria-hidden="true">
            <lucide-angular [img]="DropletsIcon" class="w-4 h-4 text-white" aria-hidden="true"></lucide-angular>
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
            aria-hidden="true"
          ></lucide-angular>
        </button>
        <button
          class="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 relative"
          aria-label="Notifications"
        >
          <lucide-angular [img]="BellIcon" class="w-4 h-4 text-slate-500" aria-hidden="true"></lucide-angular>
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
})
export class HeaderComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store<AppState>);
  private readonly walletService = inject(WalletService);

  /** The connected wallet address from the store (wallet slice). */
  protected readonly walletAddress$ = this.store.select(selectWalletAddress);

  protected isDarkMode = true;
  protected readonly MenuIcon = Menu;
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
}
