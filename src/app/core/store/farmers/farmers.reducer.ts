import { createReducer, on } from '@ngrx/store';
import * as FarmersActions from './farmers.actions';
import * as AuthActions from '../auth/auth.actions';
import { Project } from '../../models/project.model';
import { AnalyticsOverview } from '../../models/analytics.model';
import { Bmp } from '../../models/bmp.model';

export interface FarmersState {
  /** Farmer's registered parcels (projects owned by the farmer). */
  parcels: Project[];
  overview: AnalyticsOverview | null;
  loadingParcels: boolean;
  loadingOverview: boolean;
  /** True while a parcel registration is in flight. */
  registering: boolean;
  /** Timestamp (ms) of the last successful parcels fetch, for cache expiration checks. */
  lastFetched: number | null;
  /** Full list of available BMPs with server-authoritative enrolled status. */
  bmps: Bmp[];
  /** True while GET /farmers/practices is in flight. */
  loadingBmps: boolean;
  /**
   * IDs of practices whose enroll/unenroll request is currently in flight.
   * Used to show per-card loading spinners while other cards remain interactive.
   */
  enrollingPracticeIds: string[];
  error: string | null;
}

const initialState: FarmersState = {
  parcels: [],
  overview: null,
  loadingParcels: false,
  loadingOverview: false,
  registering: false,
  lastFetched: null,
  bmps: [],
  loadingBmps: false,
  enrollingPracticeIds: [],
  error: null,
};

export const farmersReducer = createReducer(
  initialState,

  // ── Load Parcels ────────────────────────────────────────────────────────────

  on(FarmersActions.loadParcels, (state) => ({
    ...state,
    loadingParcels: true,
    error: null,
  })),
  on(FarmersActions.loadParcelsSuccess, (state, { parcels }) => ({
    ...state,
    loadingParcels: false,
    parcels,
    lastFetched: Date.now(),
  })),
  on(FarmersActions.loadParcelsFailure, (state, { error }) => ({
    ...state,
    loadingParcels: false,
    error,
  })),

  // ── Register Parcel ─────────────────────────────────────────────────────────

  on(FarmersActions.registerParcel, (state) => ({
    ...state,
    registering: true,
    error: null,
  })),
  on(FarmersActions.registerParcelSuccess, (state, { parcel }) => ({
    ...state,
    registering: false,
    parcels: [parcel, ...state.parcels],
  })),
  on(FarmersActions.registerParcelFailure, (state, { error }) => ({
    ...state,
    registering: false,
    error,
  })),

  // ── Load Overview ───────────────────────────────────────────────────────────

  on(FarmersActions.loadFarmerOverview, (state) => ({
    ...state,
    loadingOverview: true,
    error: null,
  })),
  on(FarmersActions.loadFarmerOverviewSuccess, (state, { overview }) => ({
    ...state,
    loadingOverview: false,
    overview,
  })),
  on(FarmersActions.loadFarmerOverviewFailure, (state, { error }) => ({
    ...state,
    loadingOverview: false,
    error,
  })),

  // ── Load BMPs ───────────────────────────────────────────────────────────────

  on(FarmersActions.loadBmps, (state) => ({
    ...state,
    loadingBmps: true,
    error: null,
  })),
  on(FarmersActions.loadBmpsSuccess, (state, { bmps }) => ({
    ...state,
    loadingBmps: false,
    bmps,
  })),
  on(FarmersActions.loadBmpsFailure, (state, { error }) => ({
    ...state,
    loadingBmps: false,
    error,
  })),

  // ── Enroll Practice ─────────────────────────────────────────────────────────

  on(FarmersActions.enrollPractice, (state, { practiceId }) => ({
    ...state,
    enrollingPracticeIds: [...state.enrollingPracticeIds, practiceId],
  })),
  on(FarmersActions.enrollPracticeSuccess, (state, { bmp }) => ({
    ...state,
    enrollingPracticeIds: state.enrollingPracticeIds.filter((id) => id !== bmp.id),
    bmps: state.bmps.map((b) => (b.id === bmp.id ? { ...b, enrolled: true } : b)),
  })),
  on(FarmersActions.enrollPracticeFailure, (state, { practiceId }) => ({
    ...state,
    enrollingPracticeIds: state.enrollingPracticeIds.filter((id) => id !== practiceId),
  })),

  // ── Unenroll Practice ───────────────────────────────────────────────────────

  on(FarmersActions.unenrollPractice, (state, { practiceId }) => ({
    ...state,
    enrollingPracticeIds: [...state.enrollingPracticeIds, practiceId],
  })),
  on(FarmersActions.unenrollPracticeSuccess, (state, { practiceId }) => ({
    ...state,
    enrollingPracticeIds: state.enrollingPracticeIds.filter((id) => id !== practiceId),
    bmps: state.bmps.map((b) => (b.id === practiceId ? { ...b, enrolled: false } : b)),
  })),
  on(FarmersActions.unenrollPracticeFailure, (state, { practiceId }) => ({
    ...state,
    enrollingPracticeIds: state.enrollingPracticeIds.filter((id) => id !== practiceId),
  })),

  // Full cache reset on forced logout, per the cache-invalidation strategy.
  on(AuthActions.forceLogout, () => initialState),
);
