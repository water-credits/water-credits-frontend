import { createReducer, on } from '@ngrx/store';
import * as FarmersActions from './farmers.actions';
import { Project } from '../../models/project.model';
import { AnalyticsOverview } from '../../models/analytics.model';

export interface FarmersState {
  /** Farmer's registered parcels (projects owned by the farmer). */
  parcels: Project[];
  overview: AnalyticsOverview | null;
  loadingParcels: boolean;
  loadingOverview: boolean;
  /** True while a parcel registration is in flight. */
  registering: boolean;
  error: string | null;
}

const initialState: FarmersState = {
  parcels: [],
  overview: null,
  loadingParcels: false,
  loadingOverview: false,
  registering: false,
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

  // ── Farmer Overview ─────────────────────────────────────────────────────────
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
);
