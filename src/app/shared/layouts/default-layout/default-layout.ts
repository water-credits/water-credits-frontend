import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header';
import { SidebarComponent } from '../sidebar/sidebar';
import { ErrorBoundaryComponent } from '../components/error-boundary/error-boundary.component';

@Component({
  selector: 'app-default-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, ErrorBoundaryComponent],
  template: `
    <div class="min-h-screen flex flex-col">
      <app-header></app-header>
      <div class="flex flex-1">
        <app-sidebar></app-sidebar>
        <main class="flex-1 p-6 overflow-y-auto bg-slate-50 dark:bg-dark-bg">
          <app-error-boundary>
            <router-outlet></router-outlet>
          </app-error-boundary>
        </main>
      </div>
    </div>
  `,
  styles: [],
})
export class DefaultLayoutComponent {}
