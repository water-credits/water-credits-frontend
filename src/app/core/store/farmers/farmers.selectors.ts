import { createFeatureSelector, createSelector } from '@ngrx/store';
import { FarmersState } from './farmers.reducer';

export const selectFarmersState = createFeatureSelector<FarmersState>('farmers');

export const selectParcels = createSelector(selectFarmersState, (state) => state.parcels);

export const selectFarmerOverview = createSelector(selectFarmersState, (state) => state.overview);

export const selectParcelsLoading = createSelector(
  selectFarmersState,
  (state) => state.loadingParcels,
);

export const selectFarmerOverviewLoading = createSelector(
  selectFarmersState,
  (state) => state.loadingOverview,
);

export const selectFarmerRegistering = createSelector(
  selectFarmersState,
  (state) => state.registering,
);

export const selectFarmersError = createSelector(selectFarmersState, (state) => state.error);

/** Derived: number of active/baseline parcels. */
export const selectActiveParcelsCount = createSelector(
  selectParcels,
  (parcels) => parcels.filter((p) => p.status === 'active' || p.status === 'baseline').length,
);

/** Derived: total area across all parcels (hectares). */
export const selectTotalAreaHectares = createSelector(selectParcels, (parcels) =>
  parcels.reduce((sum, p) => sum + p.areaHectares, 0),
);

// ─── BMP Selectors ────────────────────────────────────────────────────────────

/** Full list of BMPs with server-authoritative enrolled status. */
export const selectBmps = createSelector(selectFarmersState, (state) => state.bmps);

/** True while the BMP list is loading. */
export const selectBmpsLoading = createSelector(selectFarmersState, (state) => state.loadingBmps);

/**
 * Array of practice IDs whose enroll/unenroll request is currently in flight.
 * Use this in the template to disable a specific card's toggle button while
 * keeping all other cards interactive.
 */
export const selectEnrollingPracticeIds = createSelector(
  selectFarmersState,
  (state) => state.enrollingPracticeIds,
);

/**
 * Parameterised selector: returns `true` while an enroll/unenroll request for
 * the given practiceId is in flight.
 *
 * Usage in a component:
 *   this.store.select(selectIsPracticeEnrolling(bmp.id))
 *
 * In the template with OnPush change detection the preferred pattern is to
 * derive a per-card Observable from a `trackBy`-keyed `*ngFor`:
 *
 *   enrollingIds$ = this.store.select(selectEnrollingPracticeIds);
 *   isEnrolling(bmp: Bmp): Observable<boolean> {
 *     return this.store.select(selectIsPracticeEnrolling(bmp.id));
 *   }
 *
 * Then bind: `[disabled]="isEnrolling(bmp) | async"`.
 * This approach creates one derived Observable per card but Angular's
 * `async` pipe will unsubscribe automatically on component destroy.
 */
export const selectIsPracticeEnrolling = (practiceId: string) =>
  createSelector(selectEnrollingPracticeIds, (ids) => ids.includes(practiceId));
