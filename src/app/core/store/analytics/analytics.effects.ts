import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, from } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';

import * as AnalyticsActions from './analytics.actions';
import { AnalyticsService } from '../../services/analytics.service';
import { RetirementService } from '../../services/retirement.service';

@Injectable()
export class AnalyticsEffects {
  private readonly actions$ = inject(Actions);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly retirementService = inject(RetirementService);

  loadOverview$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnalyticsActions.loadAnalyticsOverview),
      switchMap(() =>
        from(this.analyticsService.getOverview()).pipe(
          map((overview) => AnalyticsActions.loadAnalyticsOverviewSuccess({ overview })),
          catchError((err) =>
            of(
              AnalyticsActions.loadAnalyticsOverviewFailure({
                error: err instanceof Error ? err.message : 'Failed to load overview',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  loadCreditsOverTime$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnalyticsActions.loadCreditsOverTime),
      switchMap(({ days }) =>
        from(this.analyticsService.getCreditsOverTime(days ?? 30)).pipe(
          map((points) => AnalyticsActions.loadCreditsOverTimeSuccess({ points })),
          catchError((err) =>
            of(
              AnalyticsActions.loadCreditsOverTimeFailure({
                error: err instanceof Error ? err.message : 'Failed to load credits over time',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  loadRecentRetirements$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnalyticsActions.loadRecentRetirements),
      switchMap(() =>
        from(this.retirementService.getRetirements({ limit: 10 })).pipe(
          map((response) =>
            AnalyticsActions.loadRecentRetirementsSuccess({
              retirements: response.data.map((r) => ({
                projectName: r.projectName ?? r.projectId,
                amount: r.amount,
                retiredAt: r.retiredAt,
              })),
            }),
          ),
          catchError((err) =>
            of(
              AnalyticsActions.loadRecentRetirementsFailure({
                error: err instanceof Error ? err.message : 'Failed to load recent retirements',
              }),
            ),
          ),
        ),
      ),
    ),
  );
}
