import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, from } from 'rxjs';
import { switchMap, exhaustMap, map, catchError, tap } from 'rxjs/operators';

import * as FarmersActions from './farmers.actions';
import { ProjectsService } from '../../services/projects.service';
import { AnalyticsService } from '../../services/analytics.service';
import { NotificationService } from '../../services/notification.service';

@Injectable()
export class FarmersEffects {
  private readonly actions$ = inject(Actions);
  private readonly projectsService = inject(ProjectsService);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly notificationService = inject(NotificationService);

  /**
   * switchMap: if the farmer rapidly navigates between pages any in-flight
   * parcels request is cancelled and only the latest resolves.
   */
  loadParcels$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FarmersActions.loadParcels),
      switchMap(() =>
        from(this.projectsService.getProjects({ limit: 100 })).pipe(
          map((response) => FarmersActions.loadParcelsSuccess({ parcels: response.data || [] })),
          catchError((err) =>
            of(
              FarmersActions.loadParcelsFailure({
                error: err instanceof Error ? err.message : 'Failed to load parcels',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  /**
   * exhaustMap: prevents double-submission if the farmer clicks "Register"
   * twice while the request is in flight.
   */
  registerParcel$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FarmersActions.registerParcel),
      exhaustMap(({ data }) =>
        from(this.projectsService.createProject(data)).pipe(
          map((parcel) => FarmersActions.registerParcelSuccess({ parcel })),
          catchError((err) =>
            of(
              FarmersActions.registerParcelFailure({
                error: err instanceof Error ? err.message : 'Failed to register parcel',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  registerParcelSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(FarmersActions.registerParcelSuccess),
        tap(({ parcel }) => {
          this.notificationService.success(
            'Parcel registered',
            `${parcel.name} has been registered successfully`,
          );
        }),
      ),
    { dispatch: false },
  );

  registerParcelFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(FarmersActions.registerParcelFailure),
        tap(({ error }) => {
          this.notificationService.error('Failed to register parcel', error);
        }),
      ),
    { dispatch: false },
  );

  loadFarmerOverview$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FarmersActions.loadFarmerOverview),
      switchMap(() =>
        from(this.analyticsService.getOverview()).pipe(
          map((overview) => FarmersActions.loadFarmerOverviewSuccess({ overview })),
          catchError((err) =>
            of(
              FarmersActions.loadFarmerOverviewFailure({
                error: err instanceof Error ? err.message : 'Failed to load farmer overview',
              }),
            ),
          ),
        ),
      ),
    ),
  );
}
