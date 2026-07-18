import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { DataTableComponent, ColumnDef } from './data-table.component';
import { EmptyStateComponent } from '../empty-state/empty-state';
import { LoadingSpinnerComponent } from '../loading-spinner/loading-spinner';
import { PaginationControlsComponent } from '../pagination-controls/pagination-controls';

interface SampleRow {
  id: string;
  name: string;
}

const COLUMNS: ColumnDef<SampleRow>[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Name', sortable: true },
];

describe('DataTableComponent', () => {
  let fixture: ComponentFixture<DataTableComponent<SampleRow>>;
  let component: DataTableComponent<SampleRow>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DataTableComponent,
        PaginationControlsComponent,
        EmptyStateComponent,
        LoadingSpinnerComponent,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent<DataTableComponent<SampleRow>>(DataTableComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('columns', COLUMNS);
    fixture.componentRef.setInput('data', []);
    fixture.componentRef.setInput('loading', false);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render empty state when data is empty and not loading', () => {
    const empty = fixture.nativeElement.querySelector('app-empty-state');
    expect(empty).toBeTruthy();
  });

  it('should render loading skeleton when loading', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    const skeletons = fixture.nativeElement.querySelectorAll('.table-skeleton-line-wrapper');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render rows when data is provided', () => {
    fixture.componentRef.setInput('data', [{ id: '1', name: 'Alice' }]);
    fixture.detectChanges();
    const cells = fixture.nativeElement.querySelectorAll('tbody tr td');
    expect(cells.length).toBe(2);
    expect((cells[0]?.textContent ?? '').trim()).toBe('1');
    expect((cells[1]?.textContent ?? '').trim()).toBe('Alice');
  });

  it('should emit sort event with toggled direction when header is clicked', () => {
    const sortSpy = vi.fn();
    component.sort.subscribe(sortSpy);

    fixture.componentRef.setInput('data', [{ id: '1', name: 'Alice' }]);
    fixture.detectChanges();

    const firstHeaderButton = fixture.nativeElement.querySelectorAll('thead button')[0];
    firstHeaderButton.dispatchEvent(new MouseEvent('click'));
    expect(sortSpy).toHaveBeenCalledWith({ column: 'id', direction: 'asc' });

    firstHeaderButton.dispatchEvent(new MouseEvent('click'));
    expect(sortSpy).toHaveBeenCalledWith({ column: 'id', direction: 'desc' });
  });

  it('should show pagination controls when pagination is provided', () => {
    fixture.componentRef.setInput('pagination', { page: 2, totalPages: 2, total: 20, limit: 10 });
    fixture.detectChanges();
    const paginationEl = fixture.nativeElement.querySelector('app-pagination-controls');
    expect(paginationEl).toBeTruthy();
  });
});
