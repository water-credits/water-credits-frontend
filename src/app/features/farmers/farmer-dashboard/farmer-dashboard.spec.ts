import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { provideRouter } from '@angular/router';
import { FarmerDashboardComponent } from './farmer-dashboard';

describe('FarmerDashboardComponent', () => {
  let component: FarmerDashboardComponent;
  let fixture: ComponentFixture<FarmerDashboardComponent>;

  const initialState = {
    farmers: {
      parcels: [],
      overview: null,
      loadingParcels: false,
      loadingOverview: false,
      registering: false,
      lastFetched: null,
      error: null,
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FarmerDashboardComponent],
      providers: [provideMockStore({ initialState }), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(FarmerDashboardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
