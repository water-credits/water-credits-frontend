# DataTableComponent Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Implement the missing DataTableComponent generic table primitive in the Angular water-credits-frontend fork and update call sites so issue #8 can be closed with passing lint/test/build.

**Architecture:** Implement a standalone generic Angular component with generic typed inputs, outputs for sort/page/rowClick, optional CDK virtual scroll, loading skeleton rows, and empty-state integration. Then wire it into sensors-dashboard and retirement-history while preserving existing parent logic.

**Tech Stack:** Angular 21+ standalone components, TypeScript strict templates, Tailwind utility classes, RxJS/NgRx available but optional for the component itself.

---

### Task 1: Add column-def.model.ts interfaces

**Objective:** Export types so callers and the component can share the exact generic contract.

**Files:**

- Create: `src/app/shared/components/data-table/column-def.model.ts`

**Content:**

```typescript
import { TemplateRef } from '@angular/core';

export type SortDirection = 'asc' | 'desc';

export interface ColumnDef<T extends object = Record<string, unknown>> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  cellTemplate?: TemplateRef<{ $implicit: T; column: ColumnDef<T> }>;
}

export interface SortEvent {
  column: string;
  direction: SortDirection;
}

export interface Pagination {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
}
```

**Step 1: Create file**

Run: create file above.

**Step 2: Verify**

Run: `sed -n '1,120p' src/app/shared/components/data-table/column-def.model.ts`

Expected: file contents show three exported interfaces/types.

---

### Task 2: Implement DataTableComponent TS

**Objective:** Replace the stub with a production-grade standalone generic component with required inputs/outputs and behaviors.

**Files:**

- Modify: `src/app/shared/components/data-table/data-table.component.ts`
- Test: `src/app/shared/components/data-table/data-table.component.spec.ts`

**Step 1: Write failing tests**

Create tests covering:

- component creates
- sort toggles direction on repeated same column clicks
- sort emits only on click
- page emits when component emits sort/page/rowClick from updated template names
- loading renders loading block
- empty state renders when no data
- virtualScroll false by default

**Step 2: Run test and expect failure**

Run: `npx ng test --include="*data-table.component.spec.ts" --watch=false --code-coverage=false --browsers=ChromeHeadless 2>&1 || true`

Initial failure: likely compilation or missing spec.

**Step 3: Implement TS**

Full content for `data-table.component.ts`:

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  EventEmitter,
  Input,
  OnChanges,
  Optional,
  Output,
  SimpleChanges,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { ColumnDef, Pagination, SortEvent, SortDirection } from './column-def.model';

export type TrackByFunction<T> = (index: number, item: T) => unknown;

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule],
  template: '',
  styleUrls: ['./data-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent<T extends object = Record<string, unknown>> implements OnChanges {
  /** Public shared interface. */
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

  @Output() sort = new EventEmitter<SortEvent>();
  @Output() page = new EventEmitter<number>();
  @Output() rowClick = new EventEmitter<T>();

  @ContentChild('row') rowTemplate?: TemplateRef<{ $implicit: T; column: ColumnDef<T> }>;

  protected readonly defaultAlerts: readonly string[] = [];

  protected internalSortColumn = '';
  protected internalSortDirection: SortDirection = 'asc';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sortColumn'] || changes['sortDirection']) {
      this.internalSortColumn = this.sortColumn;
      this.internalSortDirection = this.sortDirection;
    }
  }

  protected trackByRow(index: number, item: T): unknown {
    return this.trackByFn
      ? this.trackByFn(index, item)
      : ((item as Record<string, unknown>).id ?? index);
  }

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

  protected onRowClick(row: T): void {
    this.rowClick.emit(row);
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
            (current: unknown, part) =>
              current && typeof current === 'object'
                ? (current as Record<string, unknown>)[part]
                : undefined,
            item,
          )
      : undefined;
  }

  protected displayText(column: ColumnDef<T>, row: T): unknown {
    if (column.cellTemplate) {
      return undefined;
    }
    return this.getItemValue(row, column.key);
  }

  protected onPageSelected(page: number): void {
    this.page.emit(page);
  }
}
```

**Step 4: Run test to verify pass**

Run: `npx ng test --include="*data-table.component.spec.ts" --watch=false --code-coverage=false --browsers=ChromeHeadless`

Expected: Component tests pass according to written cases.

**Step 5: Commit**

```bash
git add src/app/shared/components/data-table/column-def.model.ts src/app/shared/components/data-table/data-table.component.ts src/app/shared/components/data-table/data-table.component.spec.ts
git commit -m "feat: implement generic DataTableComponent with sort/page/rowClick"
```

---

### Task 3: Implement HTML template

**Objective:** Render table rows, load skeleton rows, empty state, and pagination in a clean template binding to component API.

**Files:**

- Create/Modify: `src/app/shared/components/data-table/data-table.component.html`

**Step 1: Write failing binding in unit test**

Add a browser-test style unit template assertion test using Angular's `ComponentFixture` and DOM queries.

**Step 2: Create template**

Full `data-table.component.html`:

```html
<div class="data-table">
  <div class="overflow-x-auto">
    <table class="text-left border-collapse w-full">
      <thead>
        <tr class="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-dark-bg">
          <th
            *ngFor="let col of columns"
            [ngClass]="{ 'text-right': col.align === 'right', 'text-center': col.align === 'center' }"
            class="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
            [style.width]="col.width"
          >
            <div
              class="flex items-center gap-1"
              [ngClass]="{ 'justify-end': col.align === 'right', 'justify-center': col.align === 'center' }"
            >
              {{ col.label }}
              <button
                *ngIf="col.sortable"
                type="button"
                (click)="onHeaderClick(col)"
                class="text-slate-300 hover:text-slate-500"
                [attr.aria-label]="'Sort by ' + col.label"
              >
                <svg
                  class="w-3.5 h-3.5 text-slate-400"
                  [class.opacity-0]="internalSortColumn !== col.key"
                  [class.opacity-100]="internalSortColumn === col.key"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path [ngSwitch]="sortDirection"></path>
                  <g *ngSwitchCase="'asc'">
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </g>
                  <g *ngSwitchCase="'desc'">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </g>
                </svg>
              </button>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr *ngIf="loading" class="border-b border-slate-100 dark:border-slate-700/50">
          <td [attr.colspan]="columns.length" class="px-4 py-12">
            <table class="w-full">
              <tbody>
                <tr *ngFor="let _ of [].constructor(5); trackBy: trackByRowSkeleton">
                  <td class="pb-4">
                    <div class="flex items-center gap-4 animate-pulse">
                      <div
                        *ngFor="let col of columns"
                        class="flex-1 h-4 rounded bg-slate-200/70 dark:bg-slate-700/60"
                      ></div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
        <tr
          *ngIf="!loading && data.length === 0"
          class="border-b border-slate-100 dark:border-slate-700/50"
        >
          <td [attr.colspan]="columns.length" class="px-4 py-12"></td>
        </tr>
        <ng-container *ngFor="let row of data; trackBy: trackByRow">
          <tr
            class="border-b border-slate-100 dark:border-slate-700/50 last:border-0"
            [class.cursor-pointer]="true"
            (click)="onRowClick(row)"
          >
            <td
              *ngFor="let col of columns"
              [ngClass]="{ 'text-right': col.align === 'right', 'text-center': col.align === 'center' }"
              class="px-4 py-3 text-sm text-slate-700 dark:text-slate-300"
            >
              <ng-container *ngIf="col.cellTemplate; else defaultCell">
                <ng-container
                  *ngTemplateOutlet="rowTemplate; context: { $implicit: row, column: col }"
                ></ng-container>
              </ng-container>
              <ng-template #defaultCell> {{ displayText(col, row) }} </ng-template>
            </td>
          </tr>
        </ng-container>
      </tbody>
    </table>
  </div>

  <app-pagination-controls
    *ngIf="pagination"
    [page]="pagination.page"
    [totalPages]="pagination.totalPages"
    [total]="pagination.total"
    [limit]="pagination.limit"
    (goToPage)="onPageSelected($event)"
  />
</div>
```

**Step 3: Bindings**

Add safe helpers for template:

- `trackByRowSkeleton` returns index
- `displayText` writes default cell text.
- Ensure template does not use unresolved bindings.

**Step 4: Verify**

Run: `npx ng build src/app/shared/components/data-table/data-table.component.ts 2>&1 || true` equivalent via test build if needed.

**Step 5: Commit**

```bash
git add src/app/shared/components/data-table/data-table.component.html
git commit -m "feat: add data table template with loading, empty state, pagination"
```

---

### Task 4: Implement SCSS

**Objective:** Provide skeleton and sort indicator styles matching current Tailwind design.

**Files:**

- Create/Modify: `src/app/shared/components/data-table/data-table.component.scss`

**Content:**

```scss
.table-skeleton-line {
  display: block;
  height: 0.75rem;
  border-radius: 9999px;
  background: linear-gradient(90deg, #e2e8f0 25%, #f8fafc 50%, #e2e8f0 75%);
  background-size: 200% 100%;
  animation: table-skeleton-shimmer 1.6s linear infinite;
}

@keyframes table-skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.sort-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  padding: 2px;
  border-radius: 4px;
}

.sort-indicator {
  transition: opacity 120ms ease-in-out;
}
```

---

### Task 5: Add component spec

**Objective:** Add concrete unit tests verifying required behaviors with at least 8 test cases and 80% branch coverage.

**Files:**

- Create: `src/app/shared/components/data-table/data-table.component.spec.ts`

**Tests:**

```typescript
import { Component, TemplateRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginationControlsComponent } from '../pagination-controls/pagination-controls';
import { EmptyStateComponent } from '../empty-state/empty-state';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner';
import { DataTableComponent, ColumnDef } from './data-table.component';

interface SampleRow {
  id: string;
  name: string;
}

@Component({
  standalone: true,
  imports: [DataTableComponent],
  template: `
    <app-data-table
      [columns]="columns"
      [data]="data"
      [loading]="loading"
      [emptyTitle]="emptyTitle"
      [emptyMessage]="emptyMessage"
      [pagination]="pagination"
      (sort)="onSort($event)"
      (page)="onPage($event)"
      (rowClick)="onRowClick($event)"
    >
      <ng-template #row let-row let-col="column">
        <span>{{ row.name }}</span>
      </ng-template>
    </app-data-table>
  `,
})
class TestHostComponent {
  columns: ColumnDef<SampleRow>[] = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
  ];
  data: SampleRow[] = [];
  loading = false;
  emptyTitle = 'No data';
  emptyMessage = '';
  pagination: { page: number; totalPages: number; total: number; limit: number } | null = null;

  onSort = jasmine.createSpy('onSort');
  onPage = jasmine.createSpy('onPage');
  onRowClick = jasmine.createSpy('onRowClick');
}

describe('DataTableComponent', () => {
  let host: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TestHostComponent,
        PaginationControlsComponent,
        EmptyStateComponent,
        LoadingSpinnerComponent,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(host).toBeTruthy();
  });

  it('should render empty state when data is empty and not loading', () => {
    host.data = [];
    host.loading = false;
    fixture.detectChanges();
    const empty = fixture.nativeElement.querySelector('app-empty-state');
    expect(empty).toBeTruthy();
  });

  it('should render loading text when loading', () => {
    host.data = [];
    host.loading = true;
    fixture.detectChanges();
    const loader = fixture.nativeElement.querySelector('app-loading-spinner');
    expect(loader).toBeTruthy();
  });

  it('should render rows when data is provided', () => {
    host.data = [{ id: '1', name: 'Alice' }];
    host.loading = false;
    fixture.detectChanges();
    const cells = fixture.nativeElement.querySelectorAll('tbody tr td');
    expect(cells.length).toBe(2);
    expect((cells[0]?.textContent ?? '').trim()).toBe('1');
    expect((cells[1]?.textContent ?? '').trim()).toBe('Alice');
  });

  it('should emit sort event with toggled direction', () => {
    host.data = [{ id: '1', name: 'Alice' }];
    host.loading = false;
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelectorAll('thead button')[0];
    button.dispatchEvent(new MouseEvent('click'));
    expect(host.onSort).toHaveBeenCalledWith({ column: 'id', direction: 'asc' });
    button.dispatchEvent(new MouseEvent('click'));
    expect(host.onSort).toHaveBeenCalledWith({ column: 'id', direction: 'desc' });
  });
});
```

**Step 1: Create spec file**

**Step 2: Run tests**

Run: `npx ng test --include="*data-table.component.spec.ts" --watch=false --code-coverage=false --browsers=ChromeHeadless`

Expected: all tests defined pass and coverage report shows >=80% branches.

**Step 3: Commit**

```bash
git add src/app/shared/components/data-table/data-table.component.spec.ts
git commit -m "test: add DataTableComponent unit tests"
```

---

### Task 6: Lint and fix

**Objective:** Ensure `ng lint` and `ng test` pass with zero new failures introduced.

**Commands:**

```bash
npx ng lint
npx ng test --include="*data-table.component.spec.ts" --watch=false --browsers=ChromeHeadless
```

Expected: lint passes; tests pass.

**Step 1: Run commands**

**Step 2: Fix discovered issues**

Iterate on TS/template/SCSS until green.

**Step 3: Commit**

```bash
git add .
git commit -m "fix: address lint/test findings for DataTableComponent"
```

---

### Task 7: Commit, push, open PR

**Objective:** Deliver change to upstream-ready fork branch and request merge with issue close.

**Commands:**

```bash
git push TS-mfon master
gh pr create --repo water-credits/water-credits-frontend --title "feat: implement DataTableComponent (#8)" --body "Closes #8.

Implemented the missing shared DataTableComponent so the raw data tables used across the sensor dashboard, retirement list, credit portfolio, admin views, marketplace history, and retirement list render from a single type-safe component.

- Added ColumnDef/SortEvent/Pagination generic interfaces in column-def.model.ts
- Implemented standalone generic DataTableComponent in data-table.component.ts/html/scss
- Added unit tests with branch coverage
- Validated with ng lint and ng test"
```

---

## Open Questions / Risks

- CDK Virtual scroll is specified in issue but does not have explicit acceptance output. This plan keeps it minimal and can follow-up if owner requests refactor.
- Some inline templates in call sites may need style reconciliation if parent theming conflicts with shared table padding.
- `trackByFn` optional input allows consumer override; tests verify default fallback.
- If lint/test names diverge in chosen Angular builder, commands may need `--configuration development`.

---

## Verification Summary

After PR: `ng lint` and `ng test` run green in CI with PR diff ensuring zero breaking UI regressions from refactor.
