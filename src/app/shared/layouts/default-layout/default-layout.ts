import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Store } from '@ngrx/store';
import { AsyncPipe } from '@angular/common';
import { HeaderComponent } from '../header/header';
import { SidebarComponent } from '../sidebar/sidebar';
import { BottomNavComponent } from '../bottom-nav/bottom-nav';
import { SwipeDirective } from '../../directives/swipe.directive';
import { AppState } from '../../../core/store/app.state';
import { setSidebarMobileOpen } from '../../../core/store/ui/ui.actions';
import { selectSidebarOpen, selectSidebarMobileOpen } from '../../../core/store/ui/ui.selectors';

@Component({
  selector: 'app-default-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    AsyncPipe,
    HeaderComponent,
    SidebarComponent,
    BottomNavComponent,
    SwipeDirective,
  ],
  template: `
    <div class="min-h-screen flex flex-col bg-slate-50 dark:bg-dark-bg">
      <app-header></app-header>

      <div class="flex flex-1 relative">
        <!-- Sidebar - hidden on mobile unless toggled -->
        <div
          class="hidden lg:block"
          [class.lg:w-64]="sidebarOpen$ | async"
          [class.lg:w-16]="!((sidebarOpen$ | async) || false)"
        >
          <app-sidebar></app-sidebar>
        </div>

        <!-- Mobile sidebar -->
        @if (sidebarMobileOpen$ | async) {
          <!-- Backdrop -->
          <div
            class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            (click)="closeMobileSidebar()"
            (appSwipe)="onBackdropSwipe($event)"
            role="presentation"
          ></div>

          <!-- Mobile sidebar panel -->
          <div
            class="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] lg:hidden shadow-2xl"
            (appSwipe)="onSidebarSwipe($event)"
          >
            <app-sidebar></app-sidebar>
          </div>
        }

        <!-- Main content area -->
        <main
          class="flex-1 overflow-y-auto pb-20 lg:pb-6 px-3 sm:px-4 lg:px-6 py-4 sm:py-6"
          [class.lg:ml-0]="true"
          appSwipe
          (appSwipe)="onContentSwipe($event)"
        >
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- Mobile bottom navigation -->
      <app-bottom-nav></app-bottom-nav>
    </div>
  `,
  styles: [
    `
      :host {
        display: contents;
      }
    `,
  ],
})
export class DefaultLayoutComponent {
  private readonly store = inject(Store<AppState>);

  protected sidebarOpen$ = this.store.select(selectSidebarOpen);
  protected sidebarMobileOpen$ = this.store.select(selectSidebarMobileOpen);

  closeMobileSidebar(): void {
    this.store.dispatch(setSidebarMobileOpen({ open: false }));
  }

  onBackdropSwipe(direction: string): void {
    if (direction === 'left') {
      this.closeMobileSidebar();
    }
  }

  onSidebarSwipe(direction: string): void {
    if (direction === 'left') {
      this.closeMobileSidebar();
    }
  }

  onContentSwipe(direction: string): void {
    if (direction === 'right') {
      this.store.dispatch(setSidebarMobileOpen({ open: true }));
    }
  }
}