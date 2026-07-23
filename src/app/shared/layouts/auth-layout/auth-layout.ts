import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ErrorBoundaryComponent } from '../components/error-boundary/error-boundary.component';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, ErrorBoundaryComponent],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-bg p-4">
      <div class="max-w-md w-full">
        <app-error-boundary>
          <router-outlet></router-outlet>
        </app-error-boundary>
      </div>
    </div>
  `,
  styles: [],
})
export class AuthLayoutComponent {}
