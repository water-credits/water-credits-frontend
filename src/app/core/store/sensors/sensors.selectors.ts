import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SensorsState } from './sensors.reducer';

export const selectSensorsState = createFeatureSelector<SensorsState>('sensors');

export const selectSensorDevices = createSelector(selectSensorsState, (state) => state.devices);
export const selectSensorReadings = createSelector(selectSensorsState, (state) => state.readings);
export const selectRecentReadings = createSelector(
  selectSensorsState,
  (state) => state.recentReadings,
);
export const selectRealTimeBuffer = createSelector(
  selectSensorsState,
  (state) => state.realTimeBuffer,
);
export const selectSensorAlerts = createSelector(selectSensorsState, (state) => state.alerts);
export const selectLatestReadings = createSelector(
  selectRealTimeBuffer,
  (buffer) => buffer[0] || null,
);
export const selectSensorSummary = createSelector(selectSensorsState, (state) => state.summary);
export const selectSensorsLoading = createSelector(selectSensorsState, (state) => state.loading);
export const selectSensorsError = createSelector(selectSensorsState, (state) => state.error);

export const selectReadingsByProjectId = createSelector(
  selectSensorsState,
  (state) => state.readingsByProjectId,
);

export const selectDevicesForProject = (projectId: string) =>
  createSelector(selectSensorDevices, (devices) =>
    devices.filter((d) => d.projectId === projectId),
  );

export const selectHistoricalReadingsForProject = (projectId: string) =>
  createSelector(selectReadingsByProjectId, (byId) => byId[projectId] ?? []);

export const selectRealtimeReadingsForProject = (projectId: string) =>
  createSelector(selectRealTimeBuffer, (buffer) =>
    buffer.filter((r) => r.projectId === projectId),
  );

export const selectChartReadingsForProject = (projectId: string) =>
  createSelector(
    selectHistoricalReadingsForProject(projectId),
    selectRealtimeReadingsForProject(projectId),
    (historical, realtime) => {
      const byId = new Map(historical.map((r) => [r.id, r]));
      for (const r of realtime) byId.set(r.id, r);
      return Array.from(byId.values()).sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );
    },
  );
