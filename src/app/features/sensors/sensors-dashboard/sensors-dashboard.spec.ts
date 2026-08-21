import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';

import { SensorsDashboardComponent } from './sensors-dashboard';
import { WebsocketService } from '../../../core/services/websocket.service';
import { SensorsService } from '../../../core/services/sensors.service';

describe('SensorsDashboardComponent', () => {
  let component: SensorsDashboardComponent;
  let fixture: ComponentFixture<SensorsDashboardComponent>;

  const initialState = {
    sensors: {
      devices: [],
      readings: [],
      readingsByProjectId: {},
      recentReadings: [],
      realTimeBuffer: [],
      alerts: [],
      summary: null,
      loading: false,
      error: null,
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SensorsDashboardComponent],
      providers: [
        provideRouter([]),
        provideMockStore({ initialState }),
        {
          provide: WebsocketService,
          useValue: {
            connected$: of(false),
            on: () => of(),
          },
        },
        {
          provide: SensorsService,
          useValue: { getDevices: vi.fn().mockResolvedValue([]) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SensorsDashboardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
