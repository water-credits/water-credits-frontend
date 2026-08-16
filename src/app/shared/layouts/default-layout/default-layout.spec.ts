import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { DefaultLayoutComponent } from './default-layout';
import { provideMockStore } from '@ngrx/store/testing';

describe('DefaultLayoutComponent', () => {
  let component: DefaultLayoutComponent;
  let fixture: ComponentFixture<DefaultLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DefaultLayoutComponent],
      providers: [provideRouter([]), provideMockStore({ initialState: {
    auth: { user: null, token: null, sessionReady: false, loading: false, error: null },
    wallet: { address: null, loading: false, error: null },
    ui: { sidebarOpen: true, isDarkMode: true, isLoading: false, notifications: [], unreadNotificationCount: 0 },
    projects: { projects: [], selectedProject: null, filters: {}, total: 0, page: 1, limit: 10, totalPages: 0, lastFetched: null, loading: false, error: null },
    sensors: { devices: [], readings: [], recentReadings: [], realTimeBuffer: [], alerts: [], summary: null, loading: false, error: null },
    credits: { portfolio: null, balances: [], transactions: [], portfolioStale: false, lastFetched: null, loading: false, error: null },
    retirement: { retirements: [], total: 0, page: 1, totalPages: 1, activeRetirement: null, certificate: null, phase: 'idle', lastFetched: null, loading: false, error: null },
    governance: { proposals: [], total: 0, page: 1, totalPages: 1, selectedProposal: null, config: null, loadingProposals: false, loadingDetail: false, loadingConfig: false, voting: false, executing: false, creating: false, lastFetched: null, error: null },
    marketplace: { listings: [], total: 0, page: 1, limit: 10, totalPages: 0, filters: {}, orderBook: null, loading: false, creating: false, cancelling: false, buyPhase: 'idle', activeListing: null, lastFetched: null, error: null },
    farmers: { parcels: [], overview: null, loadingParcels: false, loadingOverview: false, registering: false, lastFetched: null, error: null },
    analytics: { overview: null, creditsOverTime: [], recentRetirements: [], loadingOverview: false, loadingCreditsOverTime: false, loadingRecentRetirements: false, lastFetched: null, error: null },
    admin: { stats: null, statsLoading: false, statsError: null, users: [], usersLoading: false, usersError: null, configSaving: false, configError: null }
} })],
    }).compileComponents();

    fixture = TestBed.createComponent(DefaultLayoutComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
