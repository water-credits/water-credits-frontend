import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideMockStore } from '@ngrx/store/testing';

import { MarketplaceListingsComponent } from './marketplace-listings';

describe('MarketplaceListingsComponent', () => {
  let component: MarketplaceListingsComponent;
  let fixture: ComponentFixture<MarketplaceListingsComponent>;

  const initialState = {
    marketplace: {
      listings: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
      filters: {},
      orderBook: null,
      loading: false,
      creating: false,
      cancelling: false,
      buyPhase: 'idle',
      activeListing: null,
      lastFetched: null,
      error: null,
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarketplaceListingsComponent],
      providers: [provideRouter([]), provideMockStore({ initialState })],
    }).compileComponents();

    fixture = TestBed.createComponent(MarketplaceListingsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
