import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalErrorHandler } from '../../../core/services/error-handler.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-error-boundary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-container *ngIf="!hasError; else errorState">
      <ng-content></ng-content>
    </ng-container>
    <ng-template #errorState>
      <div class="flex flex-col items-center justify-center p-8 m-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <h2 class="text-xl font-bold text-red-700 dark:text-red-400 mb-2">Something went wrong</h2>
        <p class="text-red-600 dark:text-red-300 mb-4 text-center max-w-md">
          An unexpected error occurred while rendering this section.
        </p>
        <button 
          (click)="reload()" 
          class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded shadow transition-colors">
          Reload
        </button>
      </div>
    </ng-template>
  `
})
export class ErrorBoundaryComponent implements OnInit, OnDestroy {
  hasError = false;
  private sub?: Subscription;

  ngOnInit() {
    this.sub = GlobalErrorHandler.errorEvents.subscribe(() => {
      this.hasError = true;
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  reload() {
    window.location.reload();
  }
}
