import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollingModule } from '@angular/cdk/scrolling';

import {
  ColumnDef,
  Pagination,
  SortEvent,
  SortDirection,
  TrackByFunction,
} from './column-def.model';
import { EmptyStateComponent } from '../empty-state/empty-state';
import { PaginationControlsComponent } from '../pagination-controls/pagination-controls';

export type {
  ColumnDef,
  Pagination,
  SortEvent,
  SortDirection,
  TrackByFunction,
} from './column-def.model';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, ScrollingModule, EmptyStateComponent, PaginationControlsComponent],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent<T extends object = Record<string, unknown>> implements OnChanges {
  @Input() columns: ColumnDef<T>[] = [];
  @Input() data: T[] = [];
  @Input() loading = false;
  @Input() emptyTitle = 'No data';
  @Input() emptyMessage = '';
  @Input() pagination: Pagination | null = null;
  @Input() trackByFn?: TrackByFunction<T>;
  @Input() sortColumn = '';
  @Input() sortDirection: SortDirection = 'asc';
  @Input() virtualScroll = false;
  @Input() rowHeight = 48;
  /** Accessible label for the table (used as aria-label). */
  @Input() tableLabel = 'Data table';

  @Output() sort = new EventEmitter<SortEvent>();
  @Output() page = new EventEmitter<number>();
  @Output() rowClick = new EventEmitter<T>();

  @ContentChild('row') rowTemplate?: TemplateRef<{ $implicit: T; column: ColumnDef<T> }>;

  /** The currently keyboard-focused row index (−1 = no row focused). */
  protected focusedRowIndex = -1;

  protected internalSortColumn = '';
  protected internalSortDirection: SortDirection = 'asc';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sortColumn'] || changes['sortDirection']) {
      this.internalSortColumn = this.sortColumn;
      this.internalSortDirection = this.sortDirection;
    }
    // Reset focused row when data changes
    if (changes['data']) {
      this.focusedRowIndex = -1;
    }
  }

  // Arrow-bound: cdkVirtualFor invokes trackBy as a plain function call
  protected trackByRow = (index: number, item: T): unknown => {
    if (this.trackByFn) {
      return this.trackByFn(index, item);
    }
    return (item as Record<string, unknown>)['id'] ?? index;
  };

  protected trackBySkeleton = (_index: number): number => {
    return _index;
  };

  protected get align(): Record<string, string> {
    return { center: 'text-center', right: 'text-right' };
  }

  protected onHeaderClick(column: ColumnDef<T>): void {
    if (!column.sortable) {
      return;
    }
    if (this.internalSortColumn === String(column.key)) {
      this.internalSortDirection = this.internalSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.internalSortColumn = String(column.key);
      this.internalSortDirection = 'asc';
    }
    this.sort.emit({ column: this.internalSortColumn, direction: this.internalSortDirection });
  }

  protected onRowClick(row: T, index: number): void {
    this.focusedRowIndex = index;
    this.rowClick.emit(row);
  }

  /**
   * Keyboard handler for the tbody.
   * - Arrow Up/Down: move focus between rows
   * - Enter/Space: activate the focused row (same as click)
   * - Home/End: jump to first/last row
   */
  protected onRowKeydown(event: KeyboardEvent, row: T, index: number): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.moveFocus(Math.min(index + 1, this.data.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.moveFocus(Math.max(index - 1, 0));
        break;
      case 'Home':
        event.preventDefault();
        this.moveFocus(0);
        break;
      case 'End':
        event.preventDefault();
        this.moveFocus(this.data.length - 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.rowClick.emit(row);
        break;
    }
  }

  private moveFocus(targetIndex: number): void {
    this.focusedRowIndex = targetIndex;
    // The tabindex binding will update; trigger focus via querySelector
    // We use setTimeout(0) to let Angular render the tabindex change first
    setTimeout(() => {
      const tbody = document.querySelector('.data-table tbody');
      if (!tbody) return;
      const rows = tbody.querySelectorAll<HTMLElement>('tr[role="row"]');
      if (rows[targetIndex]) {
        rows[targetIndex].focus();
      }
    }, 0);
  }

  protected onPageSelected(page: unknown): void {
    const numericPage = typeof page === 'number' ? page : Number(page ?? 1);
    this.page.emit(numericPage);
  }

  protected asStringKey(key: string | number | symbol): string {
    return typeof key === 'string' ? key : String(key);
  }

  protected getItemValue(item: T, key: string | number): unknown {
    if (!key && key !== '') {
      return undefined;
    }
    return item && typeof item === 'object'
      ? key
          .toString()
          .split('.')
          .reduce(
            (current: unknown, part: string) =>
              current && typeof current === 'object'
                ? (current as Record<string, unknown>)[part]
                : undefined,
            item as Record<string, unknown>,
          )
      : undefined;
  }

  protected displayText(column: ColumnDef<T>, row: T): unknown {
    const key = this.asStringKey(column.key as string | number | symbol);
    return this.getItemValue(row, key);
  }

  /** Sort direction label for aria-sort attribute on th elements */
  protected ariaSortValue(column: ColumnDef<T>): 'ascending' | 'descending' | 'none' {
    if (this.internalSortColumn !== String(column.key)) return 'none';
    return this.internalSortDirection === 'asc' ? 'ascending' : 'descending';
  }
}
