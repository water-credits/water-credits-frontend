import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '@ngrx/store';
import { NgFor, NgIf } from '@angular/common';
import { Subject, combineLatest, takeUntil } from 'rxjs';

// 1. Import LucideAngularModule and the icon data objects
import {
  LucideAngularModule,
  ArrowLeftRight,
  ChevronLeft,
  Coins,
  Leaf,
  LayoutDashboard,
  Radio,
  ShieldCheck,
  ShoppingCart,
  Sprout,
  Vote,
} from 'lucide-angular';

import { AppState } from '../../../core/store/app.state';
import { UserRole } from '../../../core/models/user.model';
import { toggleSidebar } from '../../../core/store/ui/ui.actions';
import { selectCurrentUserRole } from '../../../core/store/auth/auth.selectors';
import { selectSidebarOpen } from '../../../core/store/ui/ui.selectors';
import { NavItem } from '../../../core/models/shared-interfaces.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  // 2. Only the module (a real Angular NgModule/component provider) goes in imports —
  //    NOT the individual icon objects, which are plain data, not Angular components.
  imports: [RouterLink, RouterLinkActive, NgIf, NgFor, LucideAngularModule],
  template: `
    <aside
      [class.w-64]="isOpen"
      [class.w-0]="!isOpen"
      [class.lg:w-16]="!isOpen"
      class="h-full bg-white dark:bg-dark-bg-lighter border-r border-slate-200 dark:border-slate-700 transition-all duration-300 overflow-hidden flex flex-col"
    >
      <div class="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        <a
          *ngFor="let item of navItems; trackBy: trackByNavItem"
          [routerLink]="item.route"
          routerLinkActive="bg-stellar-blue/10 text-stellar-blue dark:text-stellar-blue-light border-stellar-blue"
          #rla="routerLinkActive"
          [class]="
            rla.isActive
              ? 'bg-stellar-blue/10 text-stellar-blue dark:text-stellar-blue-light border-stellar-blue'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border-transparent'
          "
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border-l-2"
        >
          <!-- 3. lucide-icon comes from LucideAngularModule; [img] takes the icon data object -->
          <lucide-icon [img]="item.icon" class="w-5 h-5 shrink-0"></lucide-icon>
          <span *ngIf="isOpen" class="whitespace-nowrap">{{ item.label }}</span>
        </a>
      </div>
      <div class="p-3 border-t border-slate-200 dark:border-slate-700">
        <button
          (click)="toggle()"
          class="flex items-center gap-2 px-3 py-2 w-full rounded-lg text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <lucide-icon
            [img]="ChevronLeftIcon"
            [class.rotate-180]="!isOpen"
            class="w-4 h-4 transition-transform"
          ></lucide-icon>
          <span *ngIf="isOpen">Collapse</span>
        </button>
      </div>
    </aside>
  `,
})
export class SidebarComponent implements OnInit, OnDestroy {
  protected allNavItems: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: LayoutDashboard },
    { label: 'Projects', route: '/projects', icon: Leaf },
    { label: 'Sensors', route: '/sensors', icon: Radio },
    { label: 'Credits', route: '/credits', icon: Coins },
    { label: 'Marketplace', route: '/marketplace', icon: ShoppingCart },
    { label: 'Retirement', route: '/retirement', icon: ArrowLeftRight },
    { label: 'Farmers', route: '/farmers', icon: Sprout, roles: [UserRole.FARMER, UserRole.ADMIN] },
    { label: 'Governance', route: '/governance', icon: Vote },
    { label: 'Admin', route: '/admin', icon: ShieldCheck, roles: [UserRole.ADMIN] },
  ];

  protected navItems: NavItem[] = [];
  protected isOpen = true;
  protected readonly ChevronLeftIcon = ChevronLeft;
  private destroy$ = new Subject<void>();

  constructor(private store: Store<AppState>) {}

  ngOnInit(): void {
    const sidebarOpen$ = this.store.select(selectSidebarOpen);
    const role$ = this.store.select(selectCurrentUserRole);

    combineLatest([sidebarOpen$, role$])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([open, role]) => {
          this.isOpen = open;
          this.navItems = this.allNavItems.filter((item) => {
            if (!item.roles || item.roles.length === 0) return true;
            return role != null && item.roles.includes(role as UserRole);
          });
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggle(): void {
    this.store.dispatch(toggleSidebar());
  }

  trackByNavItem(_index: number, item: NavItem): string {
    return item.route;
  }
}