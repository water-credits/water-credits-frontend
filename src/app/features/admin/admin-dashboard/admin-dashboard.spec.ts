import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { provideRouter } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard';
import { OracleService } from '../../../core/services/oracle.service';

describe('AdminDashboardComponent', () => {
  let component: AdminDashboardComponent;
  let fixture: ComponentFixture<AdminDashboardComponent>;

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

    fixture = TestBed.createComponent(AdminDashboardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
