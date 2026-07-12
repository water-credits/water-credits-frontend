import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import {
  SensorDevice,
  SensorReading,
  ReadingBatch,
  ReadingSummary,
  SensorReadingSubmission,
} from '../models/sensor-reading.model';

@Injectable({ providedIn: 'root' })
export class SensorsService {
  constructor(private api: ApiService) {}

  async getDevices(projectId?: string): Promise<SensorDevice[]> {
    const params: Record<string, any> = {};
    if (projectId) params['projectId'] = projectId;
    return this.api.get<SensorDevice[]>('/sensors/devices', { params });
  }

  async getDevice(id: string): Promise<SensorDevice> {
    return this.api.get<SensorDevice>(`/sensors/devices/${id}`);
  }

  async registerDevice(data: Partial<SensorDevice>): Promise<SensorDevice> {
    return this.api.post<SensorDevice>('/sensors/devices', data);
  }

  async getReadings(
    deviceId: string,
    params?: { from?: string; to?: string; limit?: number },
  ): Promise<SensorReading[]> {
    return this.api.get<SensorReading[]>(`/sensors/devices/${deviceId}/readings`, { params });
  }

  async getLatestReadings(projectId: string): Promise<SensorReading[]> {
    return this.api.get<SensorReading[]>('/sensors/readings/latest', { params: { projectId } });
  }

  async getSummary(projectId: string): Promise<ReadingSummary> {
    return this.api.get<ReadingSummary>('/sensors/summary', { params: { projectId } });
  }

  async getBatches(projectId: string): Promise<ReadingBatch[]> {
    return this.api.get<ReadingBatch[]>('/sensors/batches', { params: { projectId } });
  }

  async submitReading(data: SensorReadingSubmission): Promise<SensorReading> {
    return this.api.post<SensorReading>('/sensors/readings', data);
  }
}
