import { createReducer, on } from '@ngrx/store';
import * as AnalyticsActions from './analytics.actions';
import { AnalyticsOverview, CreditsOverTimePoint } from '../../models/analytics.model';
import { RecentRetirement } from '../../models/retirement.model';

export interface AnalyticsState {
  overview: AnalyticsOverview | null;
  creditsOverTime: CreditsOverTimePoint[];
  recentRetirements: RecentRetirement[];
  loadingOverview: boolean;
  loadingCreditsOverTime: boolean;
  loadingRecentRetirements: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  overview: null,
  creditsOverTime: [],
  recentRetirements: [],
  loadingOverview: false,
  loadingCreditsOverTime: false,
  loadingRecentRetirements: false,
  error: null,
};

export const analyticsReducer = createReducer(
  initialState,

  on(AnalyticsActions.loadAnalyticsOverview, (state) => ({
    ...state,
    loadingOverview: true,
    error: null,
  })),
  on(AnalyticsActions.loadAnalyticsOverviewSuccess, (state, { overview }) => ({
    ...state,
    overview,
    loadingOverview: false,
  })),
  on(AnalyticsActions.loadAnalyticsOverviewFailure, (state, { error }) => ({
    ...state,
    loadingOverview: false,
    error,
  })),

  on(AnalyticsActions.loadCreditsOverTime, (state) => ({
    ...state,
    loadingCreditsOverTime: true,
    error: null,
  })),
  on(AnalyticsActions.loadCreditsOverTimeSuccess, (state, { points }) => ({
    ...state,
    creditsOverTime: points,
    loadingCreditsOverTime: false,
  })),
  on(AnalyticsActions.loadCreditsOverTimeFailure, (state, { error }) => ({
    ...state,
    loadingCreditsOverTime: false,
    error,
  })),

  on(AnalyticsActions.loadRecentRetirements, (state) => ({
    ...state,
    loadingRecentRetirements: true,
    error: null,
  })),
  on(AnalyticsActions.loadRecentRetirementsSuccess, (state, { retirements }) => ({
    ...state,
    recentRetirements: retirements,
    loadingRecentRetirements: false,
  })),
  on(AnalyticsActions.loadRecentRetirementsFailure, (state, { error }) => ({
    ...state,
    loadingRecentRetirements: false,
    error,
  })),
);
