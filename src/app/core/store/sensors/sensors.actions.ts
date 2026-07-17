import { createAction, props } from '@ngrx/store';
import {
  SensorDevice,
  SensorReading,
  ReadingSummary,
  SensorAlert,
} from '../../models/sensor-reading.model';

export const loadDevices = createAction('[Sensors] Load Devices', props<{ projectId?: string }>());
export const loadDevicesSuccess = createAction(
  '[Sensors] Load Devices Success',
  props<{ devices: SensorDevice[] }>(),
);
export const loadDevicesFailure = createAction(
  '[Sensors] Load Devices Failure',
  props<{ error: string }>(),
);

export const loadReadings = createAction('[Sensors] Load Readings', props<{ deviceId: string }>());
export const loadReadingsSuccess = createAction(
  '[Sensors] Load Readings Success',
  props<{ readings: SensorReading[] }>(),
);
export const loadReadingsFailure = createAction(
  '[Sensors] Load Readings Failure',
  props<{ error: string }>(),
);

export const loadSummary = createAction('[Sensors] Load Summary', props<{ projectId: string }>());
export const loadSummarySuccess = createAction(
  '[Sensors] Load Summary Success',
  props<{ summary: ReadingSummary }>(),
);
export const loadSummaryFailure = createAction(
  '[Sensors] Load Summary Failure',
  props<{ error: string }>(),
);

export const addRealtimeReading = createAction(
  '[Sensors] Add Realtime Reading',
  props<{ reading: SensorReading }>(),
);
export const clearRealtimeBuffer = createAction('[Sensors] Clear Realtime Buffer');

export const subscribeToProject = createAction(
  '[Sensors] Subscribe to Project',
  props<{ projectId: string }>(),
);
export const unsubscribeFromProject = createAction(
  '[Sensors] Unsubscribe from Project',
  props<{ projectId: string }>(),
);
export const receiveSensorReading = createAction(
  '[Sensors] Receive Sensor Reading',
  props<{ data: SensorReading }>(),
);
export const receiveSensorAlert = createAction(
  '[Sensors] Receive Sensor Alert',
  props<{ data: SensorAlert }>(),
);
