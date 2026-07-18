import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-bg p-4">
      <div class="max-w-md w-full">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [],
})
export class AuthLayoutComponent {}
