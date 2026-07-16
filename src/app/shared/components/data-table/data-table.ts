import { Component, Input, Output, EventEmitter, ContentChild, TemplateRef } from '@angular/core';
import { NgClass, NgIf, NgFor, NgTemplateOutlet } from '@angular/common';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner';
import { EmptyStateComponent } from '../empty-state/empty-state';
import { PaginationControlsComponent } from '../pagination-controls/pagination-controls';
import { LucideAngularModule, ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-angular';

export interface ColumnDef {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    NgClass,
    NgIf,
    NgFor,
    NgTemplateOutlet,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    PaginationControlsComponent,
    LucideAngularModule,
  ],
  template: `
    <div
      class="bg-white dark:bg-dark-bg-lighter rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-dark-bg">
              <th
                *ngFor="let col of columns"
                [ngClass]="{
                  'text-right': col.align === 'right',
                  'text-center': col.align === 'center',
                  'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50': col.sortable,
                }"
                class="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                [style.width]="col.width"
              >
                <div
                  class="flex items-center gap-1"
                  [ngClass]="{
                    'justify-end': col.align === 'right',
                    'justify-center': col.align === 'center',
                  }"
                >
                  {{ col.label }}
                  <button
                    *ngIf="col.sortable"
                    (click)="sort.emit(col.key)"
                    class="text-slate-300 hover:text-slate-500"
                  >
                    <lucide-angular
                      [img]="
                        sortColumn === col.key && sortDirection === 'ASC'
                          ? ArrowUpIcon
                          : sortColumn === col.key && sortDirection === 'DESC'
                            ? ArrowDownIcon
                            : ChevronsUpDownIcon
                      "
                      class="w-3.5 h-3.5"
                    ></lucide-angular>
                  </button>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <ng-container *ngIf="loading">
              <tr>
                <td [attr.colspan]="columns.length" class="px-4 py-12">
                  <app-loading-spinner size="md" label="Loading data..."></app-loading-spinner>
                </td>
              </tr>
            </ng-container>
            <ng-container *ngIf="!loading && data.length === 0">
              <tr>
                <td [attr.colspan]="columns.length" class="px-4 py-12">
                  <app-empty-state [title]="emptyTitle" [message]="emptyMessage"></app-empty-state>
                </td>
              </tr>
            </ng-container>
            <ng-container *ngIf="!loading && data.length > 0">
              <tr
                *ngFor="let row of data; let i = index; trackBy: trackByRow"
                (click)="rowClick.emit(row)"
                [ngClass]="{
                  'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50': rowClick.observed,
                  'border-b border-slate-100 dark:border-slate-700/50': i !== data.length - 1,
                }"
              >
                <ng-container *ngFor="let col of columns">
                  <td
                    [ngClass]="{
                      'text-right': col.align === 'right',
                      'text-center': col.align === 'center',
                    }"
                    class="px-4 py-3 text-sm text-slate-700 dark:text-slate-300"
                  >
                    <ng-container *ngIf="rowTemplate; else defaultCell">
                      <ng-container
                        *ngTemplateOutlet="rowTemplate; context: { $implicit: row, column: col }"
                      ></ng-container>
                    </ng-container>
                    <ng-template #defaultCell>
                      {{ getNestedValue(row, col.key) }}
                    </ng-template>
                  </td>
                </ng-container>
              </tr>
            </ng-container>
          </tbody>
        </table>
      </div>
      <app-pagination-controls
        *ngIf="showPagination"
        [page]="page"
        [totalPages]="totalPages"
        [total]="total"
        [limit]="limit"
        (goToPage)="pageChange.emit($event)"
      />
    </div>
  `,
})
export class DataTableComponent<T extends object = Record<string, unknown>> {
  @Input() columns: ColumnDef[] = [];
  @Input() data: T[] = [];
  @Input() loading = false;
  @Input() emptyTitle = 'No data';
  @Input() emptyMessage = '';
  @Input() page = 1;
  @Input() totalPages = 1;
  @Input() total = 0;
  @Input() limit = 10;
  @Input() showPagination = true;
  @Input() sortColumn = '';
  @Input() sortDirection: 'ASC' | 'DESC' = 'ASC';
  @Output() rowClick = new EventEmitter<T>();
  @Output() sort = new EventEmitter<string>();
  @Output() pageChange = new EventEmitter<number>();
  @ContentChild('row') rowTemplate?: TemplateRef<{ $implicit: T; column: ColumnDef }>;

  protected readonly ArrowUpIcon = ArrowUp;
  protected readonly ArrowDownIcon = ArrowDown;
  protected readonly ChevronsUpDownIcon = ChevronsUpDown;

  getNestedValue(obj: object, path: string): unknown {
    return path
      .split('.')
      .reduce(
        (current: Record<string, unknown> | undefined, key) =>
          (current as Record<string, unknown> | undefined)?.[key] as
            | Record<string, unknown>
            | undefined,
        obj as Record<string, unknown>,
      );
  }

  trackByRow(index: number, row: T): string {
    return ((row as Record<string, unknown>)?.['id'] as string) ?? String(index);
  }
}
