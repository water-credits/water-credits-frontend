import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { FarmerParcelDetailComponent } from './farmer-parcel-detail';
import { ProjectStatus } from '../../../core/models/project.model';
import { ParcelSensorView } from '../../../core/store/farmers/farmers-sensors.selectors';
import * as SensorsActions from '../../../core/store/sensors/sensors.actions';
import * as FarmersActions from '../../../core/store/farmers/farmers.actions';

const view: ParcelSensorView = {
  parcel: {
    id: 'parcel-a',
    ownerId: 'u1',
    name: 'North Field',
    description: 'Test',
    latitude: 1,
    longitude: 2,
    methodology: 'm',
    status: ProjectStatus.ACTIVE,
    areaHectares: 12,
    baselineStart: '',
    baselineEnd: '',
    createdAt: '',
    updatedAt: '',
  },
  devices: [
    {
      id: 'dev-a',
      projectId: 'parcel-a',
      deviceId: 'hw-1',
      manufacturer: 'X',
      model: 'Y',
      parameters: ['ph'],
      publicKey: 'pk',
      isActive: true,
      createdAt: '',
    },
  ],
  readings: [
    {
      id: 'r1',
      deviceId: 'hw-1',
      projectId: 'parcel-a',
      timestamp: '2024-01-01T10:00:00Z',
      ph: 7,
      signature: 's',
      isVerified: true,
    },
  ],
};

describe('FarmerParcelDetailComponent', () => {
  let fixture: ComponentFixture<FarmerParcelDetailComponent>;
  let store: MockStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FarmerParcelDetailComponent],
      providers: [
        provideMockStore(),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: 'parcel-a' })) },
        },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    vi.spyOn(store, 'select').mockReturnValue(of(view));
    vi.spyOn(store, 'dispatch');

    fixture = TestBed.createComponent(FarmerParcelDetailComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('dispatches parcel and sensor loads on init', () => {
    expect(store.dispatch).toHaveBeenCalledWith(FarmersActions.loadParcels());
    expect(store.dispatch).toHaveBeenCalledWith(
      SensorsActions.loadDevices({ projectId: 'parcel-a' }),
    );
    expect(store.dispatch).toHaveBeenCalledWith(
      SensorsActions.loadProjectReadings({ projectId: 'parcel-a' }),
    );
  });

  it('renders SensorChart when devices are associated', () => {
    expect(fixture.debugElement.query(By.css('app-sensor-chart'))).toBeTruthy();
  });
});
