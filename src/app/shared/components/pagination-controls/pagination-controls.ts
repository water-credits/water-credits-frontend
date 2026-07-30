import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgClass, NgIf, NgFor } from '@angular/common';
import {
  LucideAngularModule,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-angular';

@Component({
  selector: 'app-pagination-controls',
  standalone: true,
  imports: [NgClass, NgIf, NgFor, LucideAngularModule],
  template: `
    <nav
      aria-label="Pagination"
      class="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-700"
    >
      <div class="text-sm text-slate-600 dark:text-slate-400" aria-live="polite" aria-atomic="true">
        Showing <span class="font-medium">{{ startItem }}</span> to
        <span class="font-medium">{{ endItem }}</span> of
        <span class="font-medium">{{ total }}</span>
      </div>
      <div class="flex items-center gap-1" role="group" aria-label="Page navigation">
        <button
          (click)="goToPage.emit(1)"
          [disabled]="page === 1"
          class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="First page"
        >
          <lucide-angular [img]="ChevronsLeftIcon" class="w-4 h-4" aria-hidden="true"></lucide-angular>
        </button>
        <button
          (click)="goToPage.emit(page - 1)"
          [disabled]="page === 1"
          class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <lucide-angular [img]="ChevronLeftIcon" class="w-4 h-4" aria-hidden="true"></lucide-angular>
        </button>
        <ng-container *ngFor="let p of pages">
          <button
            *ngIf="p !== -1"
            (click)="goToPage.emit(p)"
            [ngClass]="{
              'bg-stellar-blue text-white': p === page,
              'hover:bg-slate-100 dark:hover:bg-slate-700': p !== page,
            }"
            [attr.aria-current]="p === page ? 'page' : null"
            [attr.aria-label]="p === page ? 'Page ' + p + ', current page' : 'Page ' + p"
            class="px-3 py-1 rounded-lg text-sm font-medium transition-colors"
          >
            {{ p }}
          </button>
          <span *ngIf="p === -1" class="px-2 text-slate-400" aria-hidden="true">...</span>
        </ng-container>
        <button
          (click)="goToPage.emit(page + 1)"
          [disabled]="page === totalPages"
          class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <lucide-angular [img]="ChevronRightIcon" class="w-4 h-4" aria-hidden="true"></lucide-angular>
        </button>
        <button
          (click)="goToPage.emit(totalPages)"
          [disabled]="page === totalPages"
          class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Last page"
        >
          <lucide-angular [img]="ChevronsRightIcon" class="w-4 h-4" aria-hidden="true"></lucide-angular>
        </button>
      </div>
    </nav>
  `,
})
export class PaginationControlsComponent {
  @Input() page = 1;
  @Input() totalPages = 1;
  @Input() total = 0;
  @Input() limit = 10;
  @Output() goToPage = new EventEmitter<number>();

  protected readonly ChevronLeftIcon = ChevronLeft;
  protected readonly ChevronRightIcon = ChevronRight;
  protected readonly ChevronsLeftIcon = ChevronsLeft;
  protected readonly ChevronsRightIcon = ChevronsRight;

  get startItem(): number {
    return this.total === 0 ? 0 : (this.page - 1) * this.limit + 1;
  }
  get endItem(): number {
    return Math.min(this.page * this.limit, this.total);
  }

  get pages(): number[] {
    const total = this.totalPages;
    const current = this.page;
    const result: number[] = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) result.push(i);
      return result;
    }
    result.push(1);
    if (current > 3) result.push(-1);
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) result.push(i);
    if (current < total - 2) result.push(-1);
    result.push(total);
    return result;
  }
}
