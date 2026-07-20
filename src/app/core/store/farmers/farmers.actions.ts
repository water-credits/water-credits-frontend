import { createAction, props } from '@ngrx/store';
import { Project, ProjectCreate } from '../../models/project.model';
import { AnalyticsOverview } from '../../models/analytics.model';

// ─── Load Parcels ─────────────────────────────────────────────────────────────

export const loadParcels = createAction('[Farmers] Load Parcels');

export const loadParcelsSuccess = createAction(
  '[Farmers] Load Parcels Success',
  props<{ parcels: Project[] }>(),
);

export const loadParcelsFailure = createAction(
  '[Farmers] Load Parcels Failure',
  props<{ error: string }>(),
);

// ─── Register Parcel ──────────────────────────────────────────────────────────

export const registerParcel = createAction(
  '[Farmers] Register Parcel',
  props<{ data: ProjectCreate }>(),
);

export const registerParcelSuccess = createAction(
  '[Farmers] Register Parcel Success',
  props<{ parcel: Project }>(),
);

export const registerParcelFailure = createAction(
  '[Farmers] Register Parcel Failure',
  props<{ error: string }>(),
);

// ─── Load Overview (analytics for farmers) ───────────────────────────────────

export const loadFarmerOverview = createAction('[Farmers] Load Overview');

export const loadFarmerOverviewSuccess = createAction(
  '[Farmers] Load Overview Success',
  props<{ overview: AnalyticsOverview }>(),
);

export const loadFarmerOverviewFailure = createAction(
  '[Farmers] Load Overview Failure',
  props<{ error: string }>(),
);
