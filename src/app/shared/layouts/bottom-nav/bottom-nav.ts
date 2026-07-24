import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppState } from '../../../core/store/app.state';
import { setSidebarMobileOpen } from '../../../core/store/ui/ui.actions';
import {
  LucideAngularModule,
  LayoutDashboard,
  Leaf,
  Radio,
  Coins,
  ShoppingCart,
} from 'lucide-angular';

interface BottomNavItem {
  label: string;
  route: string;
  icon: typeof LayoutDashboard;
}

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  template: `
    <nav
      class="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-dark-bg-lighter border-t border-slate-200 dark:border-slate-700 safe-area-bottom lg:hidden"
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div class="flex items-center justify-around h-16">
        @for (item of navItems; track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="text-stellar-blue dark:text-stellar-blue-light"
            #rla="routerLinkActive"
            class="flex flex-col items-center justify-center gap-0.5 px-3 py-1 min-w-0 flex-1 h-full transition-colors rounded-lg"
            [class.text-stellar-blue]="rla.isActive"
            [class.text-slate-500]="!rla.isActive"
            (click)="onNavigate()"
          >
            <lucide-angular
              [img]="item.icon"
              class="w-5 h-5 shrink-0"
              [class.fill-current]="rla.isActive"
            ></lucide-angular>
            <span
              class="text-[10px] font-medium leading-tight truncate max-w-full"
              [class.font-semibold]="rla.isActive"
            >
              {{ item.label }}
            </span>
            @if (rla.isActive) {
              <span class="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-stellar-blue rounded-full" aria-hidden="true"></span>
            }
          </a>
        }
      </div>
    </nav>
  `,
  styles: [
    `
      :host {
        display: contents;
      }
    `,
  ],
})
export class BottomNavComponent {
  private readonly store = inject(Store<AppState>);

  protected readonly navItems: BottomNavItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: LayoutDashboard },
    { label: 'Projects', route: '/projects', icon: Leaf },
    { label: 'Sensors', route: '/sensors', icon: Radio },
    { label: 'Credits', route: '/credits', icon: Coins },
    { label: 'Marketplace', route: '/marketplace', icon: ShoppingCart },
  ];

  onNavigate(): void {
    this.store.dispatch(setSidebarMobileOpen({ open: false }));
  }
}