import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '@ngrx/store';
import { AsyncPipe } from '@angular/common';
import { Subject, takeUntil, distinctUntilChanged } from 'rxjs';
import { AppState } from '../../../core/store/app.state';
import {
  LucideAngularModule,
  LayoutDashboard,
  Leaf,
  Radio,
  Coins,
  ShoppingCart,
  ArrowLeftRight,
  Sprout,
  Vote,
  ShieldCheck,
  ChevronLeft,
  X,
} from 'lucide-angular';
import { toggleSidebar, setSidebarMobileOpen } from '../../../core/store/ui/ui.actions';
import { selectSidebarOpen, selectSidebarMobileOpen } from '../../../core/store/ui/ui.selectors';
import { NavItem } from '../../../core/models/shared-interfaces.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AsyncPipe, LucideAngularModule],
  template: `
    <!-- Sidebar -->
    <aside
      [class.-translate-x-full]="!((sidebarMobileOpen$ | async) || false) && !isDesktop"
      [class.translate-x-0]="(sidebarMobileOpen$ | async) || false || isDesktop"
      [class.w-64]="isDesktop ? isOpen : true"
      [class.lg:w-16]="isDesktop && !isOpen"
      [class.lg:translate-x-0]="true"
      [class.fixed]="!isDesktop"
      [class.inset-y-0]="!isDesktop"
      [class.left-0]="!isDesktop"
      [class.z-50]="!isDesktop"
      [class.pt-16]="!isDesktop"
      class="h-full bg-white dark:bg-dark-bg-lighter border-r border-slate-200 dark:border-slate-700 transition-all duration-300 overflow-hidden flex flex-col"
      role="navigation"
      aria-label="Main navigation"
    >
      <!-- Mobile close button -->
      @if (!isDesktop) {
        <div class="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <span class="text-sm font-semibold text-slate-900 dark:text-white">Navigation</span>
          <button
            (click)="closeMobile()"
            class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 touch-manipulation"
            aria-label="Close navigation"
          >
            <lucide-angular [img]="XIcon" class="w-5 h-5 text-slate-500"></lucide-angular>
          </button>
        </div>
      }

      <div class="flex-1 py-4 space-y-1 px-2 overflow-y-auto overflow-x-hidden">
        @for (item of navItems; track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="bg-stellar-blue/10 text-stellar-blue dark:text-stellar-blue-light border-stellar-blue"
            #rla="routerLinkActive"
            [class]="
              rla.isActive
                ? 'bg-stellar-blue/10 text-stellar-blue dark:text-stellar-blue-light border-stellar-blue'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border-transparent'
            "
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border-l-2 touch-manipulation"
            (click)="onNavClick()"
          >
            <lucide-angular [img]="item.icon" class="w-5 h-5 shrink-0"></lucide-angular>
            @if (isDesktop ? isOpen : true) {
              <span class="whitespace-nowrap truncate">{{ item.label }}</span>
            }
          </a>
        }
      </div>

      <!-- Desktop collapse toggle -->
      @if (isDesktop) {
        <div class="p-3 border-t border-slate-200 dark:border-slate-700">
          <button
            (click)="toggleDesktop()"
            class="flex items-center gap-2 px-3 py-2 w-full rounded-lg text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors touch-manipulation"
            [attr.aria-label]="isOpen ? 'Collapse sidebar' : 'Expand sidebar'"
          >
            <lucide-angular
              [img]="ChevronLeftIcon"
              [class.rotate-180]="!isOpen"
              class="w-4 h-4 transition-transform shrink-0"
            ></lucide-angular>
            @if (isOpen) {
              <span>Collapse</span>
            }
          </button>
        </div>
      }
    </aside>
  `,
  styles: [
    `
      :host {
        display: contents;
      }
    `,
  ],
})
export class SidebarComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store<AppState>);

  protected navItems: NavItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: LayoutDashboard },
    { label: 'Projects', route: '/projects', icon: Leaf },
    { label: 'Sensors', route: '/sensors', icon: Radio },
    { label: 'Credits', route: '/credits', icon: Coins },
    { label: 'Marketplace', route: '/marketplace', icon: ShoppingCart },
    { label: 'Retirement', route: '/retirement', icon: ArrowLeftRight },
    { label: 'Farmers', route: '/farmers', icon: Sprout },
    { label: 'Governance', route: '/governance', icon: Vote },
    { label: 'Admin', route: '/admin', icon: ShieldCheck },
  ];

  protected isOpen = true;
  protected isDesktop = true;
  protected sidebarMobileOpen$ = this.store.select(selectSidebarMobileOpen);

  protected readonly ChevronLeftIcon = ChevronLeft;
  protected readonly XIcon = X;

  private readonly destroy$ = new Subject<void>();

  constructor() {
    this.checkViewport();
  }

  ngOnInit(): void {
    this.store
      .select(selectSidebarOpen)
      .pipe(takeUntil(this.destroy$))
      .subscribe((open) => {
        this.isOpen = open;
      });

    // Listen for viewport changes
    this.store
      .select(selectSidebarMobileOpen)
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe();

    window.addEventListener('resize', this.handleResize);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    window.removeEventListener('resize', this.handleResize);
  }

  private handleResize = (): void => {
    const wasDesktop = this.isDesktop;
    this.checkViewport();
    // Auto-close mobile sidebar when resizing to desktop
    if (!wasDesktop && this.isDesktop) {
      this.store.dispatch(setSidebarMobileOpen({ open: false }));
    }
  };

  private checkViewport(): void {
    this.isDesktop = window.innerWidth >= 1024;
  }

  toggleDesktop(): void {
    this.store.dispatch(toggleSidebar());
  }

  closeMobile(): void {
    this.store.dispatch(setSidebarMobileOpen({ open: false }));
  }

  onNavClick(): void {
    if (!this.isDesktop) {
      this.closeMobile();
    }
  }

  onSwipe(direction: string): void {
    if (direction === 'left') {
      this.closeMobile();
    }
  }

  trackByNavItem(_index: number, item: NavItem): string {
    return item.route;
  }
}