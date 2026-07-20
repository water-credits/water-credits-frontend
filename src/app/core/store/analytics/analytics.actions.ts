import { createAction, props } from '@ngrx/store';
import { AnalyticsOverview, CreditsOverTimePoint } from '../../models/analytics.model';
import { RecentRetirement } from '../../models/retirement.model';

// ─── Overview ─────────────────────────────────────────────────────────────────

export const loadAnalyticsOverview = createAction('[Analytics] Load Overview');

export const loadAnalyticsOverviewSuccess = createAction(
  '[Analytics] Load Overview Success',
  props<{ overview: AnalyticsOverview }>(),
);

export const loadAnalyticsOverviewFailure = createAction(
  '[Analytics] Load Overview Failure',
  props<{ error: string }>(),
);

// ─── Credits Over Time ────────────────────────────────────────────────────────

export const loadCreditsOverTime = createAction(
  '[Analytics] Load Credits Over Time',
  props<{ days?: number }>(),
);

export const loadCreditsOverTimeSuccess = createAction(
  '[Analytics] Load Credits Over Time Success',
  props<{ points: CreditsOverTimePoint[] }>(),
);

export const loadCreditsOverTimeFailure = createAction(
  '[Analytics] Load Credits Over Time Failure',
  props<{ error: string }>(),
);

// ─── Recent Retirements ───────────────────────────────────────────────────────

export const loadRecentRetirements = createAction('[Analytics] Load Recent Retirements');

export const loadRecentRetirementsSuccess = createAction(
  '[Analytics] Load Recent Retirements Success',
  props<{ retirements: RecentRetirement[] }>(),
);

export const loadRecentRetirementsFailure = createAction(
  '[Analytics] Load Recent Retirements Failure',
  props<{ error: string }>(),
);
