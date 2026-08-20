import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { provideRouter } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard';
import { OracleService } from '../../../core/services/oracle.service';
import { Store } from '@ngrx/store';
import * as AdminActions from '../../../core/store/admin/admin.actions';

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;
  let store: MockStore;

  const initialState = {
    analytics: {
      overview: null,
      creditsOverTime: [],
      recentRetirements: [],
      loadingOverview: false,
      loadingCreditsOverTime: false,
      loadingRecentRetirements: false,
      lastFetched: null,
      error: null,
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers: [
        provideMockStore({ initialState }),
        provideRouter([]),
        {
          provide: OracleService,
          useValue: { getSubmissions: vi.fn().mockResolvedValue({ data: [] }) },
        },
      ],
    }).compileComponents();

    store = TestBed.inject(Store) as MockStore;
    vi.spyOn(store, 'dispatch');
    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should dispatch loadAdminStats and loadUsers on init', () => {
    component.ngOnInit();
    expect(store.dispatch).toHaveBeenCalledWith(AdminActions.loadAdminStats());
    expect(store.dispatch).toHaveBeenCalledWith(AdminActions.loadUsers({ page: 1, limit: 10 }));
  });
});
