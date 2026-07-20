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
