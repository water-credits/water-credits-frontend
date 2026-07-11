import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '@ngrx/store';
import { NgIf } from '@angular/common';
import { AppState } from '../../../core/store/app.state';
import { LucideAngularModule, LayoutDashboard, Leaf, Radio, Coins, ShoppingCart, ArrowLeftRight, Sprout, Vote, ShieldCheck, ChevronLeft } from 'lucide-angular';
import { toggleSidebar } from '../../../core/store/ui/ui.actions';
import { NavItem } from '../../../core/models/shared-interfaces.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf, LucideAngularModule],
  template: `
    <aside [class.w-64]="isOpen" [class.w-0]="!isOpen" [class.lg:w-16]="!isOpen" class="h-full bg-white dark:bg-dark-bg-lighter border-r border-slate-200 dark:border-slate-700 transition-all duration-300 overflow-hidden flex flex-col">
      <div class="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        <a *ngFor="let item of navItems" [routerLink]="item.route" routerLinkActive="bg-stellar-blue/10 text-stellar-blue dark:text-stellar-blue-light border-stellar-blue" #rla="routerLinkActive" [class]="rla.isActive ? 'bg-stellar-blue/10 text-stellar-blue dark:text-stellar-blue-light border-stellar-blue' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border-transparent'" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border-l-2">
          <lucide-angular [img]="item.icon" class="w-5 h-5 shrink-0"></lucide-angular>
          <span *ngIf="isOpen" class="whitespace-nowrap">{{ item.label }}</span>
        </a>
      </div>
      <div class="p-3 border-t border-slate-200 dark:border-slate-700">
        <button (click)="toggle()" class="flex items-center gap-2 px-3 py-2 w-full rounded-lg text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
          <lucide-angular [img]="ChevronLeftIcon" [class.rotate-180]="!isOpen" class="w-4 h-4 transition-transform"></lucide-angular>
          <span *ngIf="isOpen">Collapse</span>
        </button>
      </div>
    </aside>
  `
})
export class SidebarComponent {
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
  protected readonly ChevronLeftIcon = ChevronLeft;

  constructor(private store: Store<AppState>) {
    this.store.select(state => state.ui.sidebarOpen).subscribe(open => {
      this.isOpen = open;
    });
  }

  toggle(): void {
    this.store.dispatch(toggleSidebar());
  }
}
