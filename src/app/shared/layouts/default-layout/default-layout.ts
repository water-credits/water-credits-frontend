import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header';
import { SidebarComponent } from '../sidebar/sidebar';
import { ToastContainerComponent } from '../../components/toast-container/toast-container.component';

@Component({
  selector: 'app-default-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, ToastContainerComponent],
  template: `
    <div class="min-h-screen flex flex-col">
      <app-header></app-header>
      <div class="flex flex-1">
        <app-sidebar></app-sidebar>
        <main class="flex-1 p-6 overflow-y-auto bg-slate-50 dark:bg-dark-bg">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
    <!-- Global toast layer — rendered outside the scrollable content area -->
    <app-toast-container></app-toast-container>
  `,
  styles: [],
})
export class DefaultLayoutComponent {}
