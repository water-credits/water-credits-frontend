import { createReducer, on } from '@ngrx/store';
import * as SensorsActions from './sensors.actions';
import {
  SensorDevice,
  SensorReading,
  ReadingSummary,
  SensorAlert,
} from '../../models/sensor-reading.model';

export interface SensorsState {
  devices: SensorDevice[];
  readings: SensorReading[];
  recentReadings: SensorReading[];
  realTimeBuffer: SensorReading[];
  alerts: SensorAlert[];
  summary: ReadingSummary | null;
  loading: boolean;
  error: string | null;
}

const initialState: SensorsState = {
  devices: [],
  readings: [],
  recentReadings: [],
  realTimeBuffer: [],
  alerts: [],
  summary: null,
  loading: false,
  error: null,
};

export const sensorsReducer = createReducer(
  initialState,
  on(SensorsActions.loadDevices, (state) => ({ ...state, loading: true, error: null })),
  on(SensorsActions.loadDevicesSuccess, (state, { devices }) => ({
    ...state,
    loading: false,
    devices,
  })),
  on(SensorsActions.loadDevicesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(SensorsActions.loadReadings, (state) => ({ ...state, loading: true })),
  on(SensorsActions.loadReadingsSuccess, (state, { readings }) => ({
    ...state,
    loading: false,
    readings,
  })),
  on(SensorsActions.loadReadingsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(SensorsActions.loadSummary, (state) => ({ ...state, loading: true })),
  on(SensorsActions.loadSummarySuccess, (state, { summary }) => ({
    ...state,
    loading: false,
    summary,
  })),
  on(SensorsActions.loadSummaryFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(SensorsActions.addRealtimeReading, (state, { reading }) => ({
    ...state,
    recentReadings: [reading, ...state.recentReadings].slice(0, 100),
    realTimeBuffer: [reading, ...state.realTimeBuffer].slice(0, 100),
  })),
  on(SensorsActions.receiveSensorReading, (state, { data }) => ({
    ...state,
    recentReadings: [data, ...state.recentReadings].slice(0, 100),
    realTimeBuffer: [data, ...state.realTimeBuffer].slice(0, 100),
  })),
  on(SensorsActions.receiveSensorAlert, (state, { data }) => ({
    ...state,
    alerts: [data, ...state.alerts],
  })),
  on(SensorsActions.clearRealtimeBuffer, (state) => ({
    ...state,
    recentReadings: [],
    realTimeBuffer: [],
  })),
);
