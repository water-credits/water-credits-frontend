import { createReducer, on } from '@ngrx/store';
import * as SensorsActions from './sensors.actions';
import { SensorDevice, SensorReading, ReadingSummary } from '../../models/sensor-reading.model';

export interface SensorsState {
  devices: SensorDevice[];
  readings: SensorReading[];
  recentReadings: SensorReading[];
  summary: ReadingSummary | null;
  loading: boolean;
  error: string | null;
}

const initialState: SensorsState = {
  devices: [],
  readings: [],
  recentReadings: [],
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
  })),
  on(SensorsActions.clearRealtimeBuffer, (state) => ({ ...state, recentReadings: [] })),
);
