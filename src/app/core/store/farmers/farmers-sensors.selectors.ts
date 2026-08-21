import { createSelector } from '@ngrx/store';
import { Project } from '../../models/project.model';
import { SensorDevice, SensorReading } from '../../models/sensor-reading.model';
import { selectParcels } from './farmers.selectors';
import {
  selectSensorDevices,
  selectReadingsByProjectId,
  selectRealTimeBuffer,
  selectChartReadingsForProject,
  selectDevicesForProject,
} from '../sensors/sensors.selectors';

export interface ParcelSensorView {
  parcel: Project;
  devices: SensorDevice[];
  readings: SensorReading[];
}

function mergeReadings(
  historical: SensorReading[],
  realtime: SensorReading[],
): SensorReading[] {
  const byId = new Map(historical.map((r) => [r.id, r]));
  for (const r of realtime) byId.set(r.id, r);
  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
}

export const selectParcelsWithSensors = createSelector(
  selectParcels,
  selectSensorDevices,
  selectReadingsByProjectId,
  selectRealTimeBuffer,
  (parcels, devices, readingsByProjectId, realTimeBuffer): ParcelSensorView[] =>
    parcels.map((parcel) => ({
      parcel,
      devices: devices.filter((d) => d.projectId === parcel.id),
      readings: mergeReadings(
        readingsByProjectId[parcel.id] ?? [],
        realTimeBuffer.filter((r) => r.projectId === parcel.id),
      ),
    })),
);

export const selectParcelById = (parcelId: string) =>
  createSelector(selectParcels, (parcels) => parcels.find((p) => p.id === parcelId) ?? null);

export const selectParcelSensorView = (parcelId: string) =>
  createSelector(
    selectParcelById(parcelId),
    selectDevicesForProject(parcelId),
    selectChartReadingsForProject(parcelId),
    (parcel, devices, readings): ParcelSensorView | null =>
      parcel ? { parcel, devices, readings } : null,
  );
