import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { GovernanceDashboardComponent } from './governance-dashboard';

import { provideMockStore } from '@ngrx/store/testing';

describe('GovernanceDashboardComponent', () => {
  let component: GovernanceDashboardComponent;
  let fixture: ComponentFixture<GovernanceDashboardComponent>;

  const initialState = {
    governance: {
      proposals: [],
      total: 0,
      page: 1,
      totalPages: 1,
      selectedProposal: null,
      config: null,
      loadingProposals: false,
      loadingDetail: false,
      loadingConfig: false,
      voting: false,
      executing: false,
      creating: false,
      lastFetched: null,
      error: null,
    },
    auth: {
      user: null,
      token: null,
      sessionReady: false,
      loading: false,
      error: null,
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GovernanceDashboardComponent],
      providers: [provideRouter([]), provideMockStore({ initialState })],
    }).compileComponents();

    fixture = TestBed.createComponent(GovernanceDashboardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
