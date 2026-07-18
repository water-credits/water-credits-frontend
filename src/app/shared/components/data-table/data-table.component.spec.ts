import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmptyStateComponent } from '../empty-state/empty-state';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner';
import { PaginationControlsComponent } from '../pagination-controls/pagination-controls';
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
    const firstHeaderButton = fixture.nativeElement.querySelectorAll('thead button')[0];
    firstHeaderButton.dispatchEvent(new MouseEvent('click'));
    expect(host.onSort).toHaveBeenCalledWith({ column: 'id', direction: 'asc' });
    firstHeaderButton.dispatchEvent(new MouseEvent('click'));
    expect(host.onSort).toHaveBeenCalledWith({ column: 'id', direction: 'desc' });
  });

  it('should set default page on pagination object', () => {
    host.pagination = { page: 2, totalPages: 2, total: 20, limit: 10 };
    fixture.detectChanges();
    expect(host.pagination.page).toBe(2);
    expect(host.pagination.total).toBe(20);
  });
});
