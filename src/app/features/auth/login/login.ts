import { Component } from '@angular/core';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { AsyncPipe, NgIf } from '@angular/common';
import { LucideAngularModule, Droplets } from 'lucide-angular';
import { AppState } from '../../../core/store/app.state';
import * as AuthActions from '../../../core/store/auth/auth.actions';
import { selectAuthLoading, selectAuthError } from '../../../core/store/auth/auth.selectors';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [NgIf, AsyncPipe, LucideAngularModule],
  template: `
    <div
      class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-dark-bg dark:to-dark-bg-lighter p-4"
    >
      <div class="max-w-md w-full">
        <div class="text-center mb-8">
          <div
            class="w-16 h-16 rounded-2xl bg-stellar-blue flex items-center justify-center mx-auto mb-4"
          >
            <lucide-angular [img]="DropletsIcon" class="w-8 h-8 text-white" aria-hidden="true"></lucide-angular>
          </div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Water Credits</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Connect your Stellar wallet to continue
          </p>
        </div>

        <div
          class="bg-white dark:bg-dark-bg-lighter rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-8"
        >
          <div class="text-center mb-6">
            <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Sign In</h2>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Authenticate with your Stellar wallet
            </p>
          </div>

          <div
            *ngIf="error$ | async as error"
            class="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            role="alert"
          >
            <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
          </div>

          <div class="space-y-4">
            <button
              (click)="handleLogin()"
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
              {{ (loading$ | async) ? 'Connecting...' : 'Connect Wallet' }}
            </button>
          </div>

          <div class="mt-6 text-center">
            <p class="text-xs text-slate-400">
              By connecting, you agree to the
              <a href="#" class="text-stellar-blue hover:underline">Terms of Service</a>
            </p>
          </div>
        </div>

        <div class="mt-4 text-center">
          <p class="text-xs text-slate-400">
            New to Water Credits?
            <a routerLink="/auth/register" class="text-stellar-blue hover:underline"
              >Create an account</a
            >
          </p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly store = inject(Store<AppState>);

  protected readonly loading$ = this.store.select(selectAuthLoading);
  protected readonly error$ = this.store.select(selectAuthError);
  protected readonly DropletsIcon = Droplets;

  handleLogin(): void {
    this.store.dispatch(AuthActions.login());
  }
}
