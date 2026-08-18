import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';

import { DashboardComponent } from './dashboard';
import { WebsocketService } from '../../../core/services/websocket.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

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
      imports: [DashboardComponent],
      providers: [
        provideMockStore({ initialState }),
        {
          provide: WebsocketService,
          useValue: {
            connected$: of(false),
            sensorAlerts$: of(),
            on: () => of(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
