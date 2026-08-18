import { createAction, props } from '@ngrx/store';
import { Project, ProjectCreate } from '../../models/project.model';
import { AnalyticsOverview } from '../../models/analytics.model';
import { Bmp } from '../../models/bmp.model';

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

// ─── Load BMPs ────────────────────────────────────────────────────────────────

export const loadBmps = createAction('[Farmers] Load BMPs');

export const loadBmpsSuccess = createAction(
  '[Farmers] Load BMPs Success',
  props<{ bmps: Bmp[] }>(),
);

export const loadBmpsFailure = createAction(
  '[Farmers] Load BMPs Failure',
  props<{ error: string }>(),
);

// ─── Enroll Practice ──────────────────────────────────────────────────────────

export const enrollPractice = createAction(
  '[Farmers] Enroll Practice',
  props<{ practiceId: string }>(),
);

export const enrollPracticeSuccess = createAction(
  '[Farmers] Enroll Practice Success',
  props<{ bmp: Bmp }>(),
);

export const enrollPracticeFailure = createAction(
  '[Farmers] Enroll Practice Failure',
  props<{ practiceId: string; error: string }>(),
);

// ─── Unenroll Practice ────────────────────────────────────────────────────────

export const unenrollPractice = createAction(
  '[Farmers] Unenroll Practice',
  props<{ practiceId: string }>(),
);

export const unenrollPracticeSuccess = createAction(
  '[Farmers] Unenroll Practice Success',
  props<{ practiceId: string }>(),
);

export const unenrollPracticeFailure = createAction(
  '[Farmers] Unenroll Practice Failure',
  props<{ practiceId: string; error: string }>(),
);
