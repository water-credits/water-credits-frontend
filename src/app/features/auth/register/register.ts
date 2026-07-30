import { Component } from '@angular/core';
import { inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AsyncPipe, NgIf } from '@angular/common';
import { Store } from '@ngrx/store';
import { LucideAngularModule, Droplets } from 'lucide-angular';
import { AppState } from '../../../core/store/app.state';
import * as AuthActions from '../../../core/store/auth/auth.actions';
import { selectAuthLoading, selectAuthError } from '../../../core/store/auth/auth.selectors';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, FormsModule, NgIf, AsyncPipe, LucideAngularModule],
  template: `
    <div
      class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-dark-bg dark:to-dark-bg-lighter p-4"
    >
      <div class="max-w-md w-full">
        <div class="text-center mb-8">
          <div
            class="w-16 h-16 rounded-2xl bg-stellar-blue flex items-center justify-center mx-auto mb-4"
          >
            <lucide-angular [img]="Droplets" class="w-8 h-8 text-white" aria-hidden="true"></lucide-angular>
          </div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Create Account</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Register with your Stellar wallet
          </p>
        </div>

        <div
          class="bg-white dark:bg-dark-bg-lighter rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-8"
        >
          <div
            *ngIf="error$ | async as error"
            class="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            role="alert"
          >
            <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
          </div>

          <div class="space-y-4">
            <div>
              <label class="label" for="displayName">Display Name (optional)</label>
              <input
                id="displayName"
                type="text"
                [(ngModel)]="displayName"
                class="input"
                placeholder="Your name"
              />
            </div>
            <div>
              <label class="label" for="email">Email (optional)</label>
              <input
                id="email"
                type="email"
                [(ngModel)]="email"
                class="input"
                placeholder="your@email.com"
              />
            </div>
            <button
              (click)="handleRegister()"
              [disabled]="loading$ | async"
              class="btn btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              <svg
                *ngIf="loading$ | async"
                class="animate-spin w-5 h-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                ></path>
              </svg>
              {{ (loading$ | async) ? 'Connecting...' : 'Connect Wallet & Register' }}
            </button>
          </div>

          <div class="mt-6 text-center">
            <p class="text-xs text-slate-400">
              Already have an account?
              <a routerLink="/auth/login" class="text-stellar-blue hover:underline">Sign in</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private readonly store = inject(Store<AppState>);

  protected displayName = '';
  protected email = '';
  protected readonly loading$ = this.store.select(selectAuthLoading);
  protected readonly error$ = this.store.select(selectAuthError);
  protected readonly Droplets = Droplets;

  handleRegister(): void {
    this.store.dispatch(
      AuthActions.register({
        email: this.email || undefined,
        displayName: this.displayName || undefined,
      }),
    );
  }
}
