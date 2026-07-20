import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AnalyticsState } from './analytics.reducer';

export const selectAnalyticsState = createFeatureSelector<AnalyticsState>('analytics');

export const selectAnalyticsOverview = createSelector(
  selectAnalyticsState,
  (state) => state.overview,
);

export const selectCreditsOverTime = createSelector(
  selectAnalyticsState,
  (state) => state.creditsOverTime,
);

export const selectRecentRetirements = createSelector(
  selectAnalyticsState,
  (state) => state.recentRetirements,
);

export const selectAnalyticsOverviewLoading = createSelector(
  selectAnalyticsState,
  (state) => state.loadingOverview,
);

export const selectCreditsOverTimeLoading = createSelector(
  selectAnalyticsState,
  (state) => state.loadingCreditsOverTime,
);

export const selectAnalyticsError = createSelector(selectAnalyticsState, (state) => state.error);

/** True while any of the three dashboard data sources is loading. */
export const selectDashboardLoading = createSelector(
  selectAnalyticsState,
  (state) =>
    state.loadingOverview || state.loadingCreditsOverTime || state.loadingRecentRetirements,
);
