import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, from } from 'rxjs';
import { switchMap, exhaustMap, mergeMap, map, catchError, tap } from 'rxjs/operators';

import * as FarmersActions from './farmers.actions';
import { ProjectsService } from '../../services/projects.service';
import { AnalyticsService } from '../../services/analytics.service';
import { FarmersService } from '../../services/farmers.service';
import { NotificationService } from '../../services/notification.service';

@Injectable()
export class FarmersEffects {
  private readonly actions$ = inject(Actions);
  private readonly projectsService = inject(ProjectsService);
  private readonly analyticsService = inject(AnalyticsService);
  private readonly farmersService = inject(FarmersService);
  private readonly notificationService = inject(NotificationService);

  // ── Load Parcels ────────────────────────────────────────────────────────────

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

  // ── Register Parcel ─────────────────────────────────────────────────────────

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

  // ── Load Farmer Overview ────────────────────────────────────────────────────

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

  // ── Load BMPs ───────────────────────────────────────────────────────────────

  /**
   * switchMap: a navigation-triggered re-fetch cancels any prior in-flight
   * request. FarmersService.getBmps() gracefully falls back to [] on 404.
   */
  loadBmps$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FarmersActions.loadBmps),
      switchMap(() =>
        from(this.farmersService.getBmps()).pipe(
          map((bmps) => FarmersActions.loadBmpsSuccess({ bmps })),
          catchError((err) =>
            of(
              FarmersActions.loadBmpsFailure({
                error: err instanceof Error ? err.message : 'Failed to load practices',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  // ── Enroll Practice ─────────────────────────────────────────────────────────

  /**
   * mergeMap: each card is an independent, idempotent operation. Using
   * mergeMap (rather than exhaustMap) means toggling card A while card B's
   * request is in flight works correctly — both requests run concurrently.
   *
   * Duplicate in-flight requests for the same card are prevented at the UI
   * level via `enrollingPracticeIds`: the card's toggle button is disabled
   * while its practiceId is in that array, so a second click cannot be
   * dispatched.
   */
  enrollPractice$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FarmersActions.enrollPractice),
      mergeMap(({ practiceId }) =>
        from(this.farmersService.enrollBmp(practiceId)).pipe(
          map((bmp) => FarmersActions.enrollPracticeSuccess({ bmp })),
          catchError((err) =>
            of(
              FarmersActions.enrollPracticeFailure({
                practiceId,
                error: err instanceof Error ? err.message : 'Failed to enroll in practice',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  enrollPracticeSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(FarmersActions.enrollPracticeSuccess),
        tap(({ bmp }) => {
          this.notificationService.success('Enrolled', `You are now enrolled in ${bmp.name}`);
        }),
      ),
    { dispatch: false },
  );

  enrollPracticeFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(FarmersActions.enrollPracticeFailure),
        tap(({ error }) => {
          this.notificationService.error('Enrollment failed', error);
        }),
      ),
    { dispatch: false },
  );

  // ── Unenroll Practice ───────────────────────────────────────────────────────

  /**
   * mergeMap: same rationale as enrollPractice$.
   */
  unenrollPractice$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FarmersActions.unenrollPractice),
      mergeMap(({ practiceId }) =>
        from(this.farmersService.unenrollBmp(practiceId)).pipe(
          map(() => FarmersActions.unenrollPracticeSuccess({ practiceId })),
          catchError((err) =>
            of(
              FarmersActions.unenrollPracticeFailure({
                practiceId,
                error: err instanceof Error ? err.message : 'Failed to unenroll from practice',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  unenrollPracticeSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(FarmersActions.unenrollPracticeSuccess),
        tap(({ practiceId }) => {
          this.notificationService.info('Unenrolled', `You have unenrolled from ${practiceId}`);
        }),
      ),
    { dispatch: false },
  );

  unenrollPracticeFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(FarmersActions.unenrollPracticeFailure),
        tap(({ error }) => {
          this.notificationService.error('Unenrollment failed', error);
        }),
      ),
    { dispatch: false },
  );
}
