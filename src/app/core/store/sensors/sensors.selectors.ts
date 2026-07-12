import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SensorsState } from './sensors.reducer';

export const selectSensorsState = createFeatureSelector<SensorsState>('sensors');

export const selectSensorDevices = createSelector(selectSensorsState, state => state.devices);
export const selectSensorReadings = createSelector(selectSensorsState, state => state.readings);
export const selectRecentReadings = createSelector(selectSensorsState, state => state.recentReadings);
export const selectSensorSummary = createSelector(selectSensorsState, state => state.summary);
export const selectSensorsLoading = createSelector(selectSensorsState, state => state.loading);
export const selectSensorsError = createSelector(selectSensorsState, state => state.error);
