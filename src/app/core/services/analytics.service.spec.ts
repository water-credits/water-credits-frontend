import { TestBed } from '@angular/core/testing';
import { AnalyticsService } from './analytics.service';
import { ApiService } from './api.service';
import {
  generateOracleAnomalies,
  generateOracleNodes,
  generateOracleTimeseries,
} from './oracle-metrics.mock';
import {
  OracleAnomaly,
  OracleNodeHealth,
  OracleSubmissionsQuery,
  OracleTimeseriesPoint,
  PaginatedOracleSubmissions,
} from '../models/oracle-metrics.model';

describe('AnalyticsService oracle-metrics methods', () => {
  let service: AnalyticsService;
  let api: { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    api = { get: vi.fn() };
    TestBed.configureTestingModule({
      providers: [AnalyticsService, { provide: ApiService, useValue: api }],
    });
    service = TestBed.inject(AnalyticsService);
  });

  it('getOracleNodes maps the API payload', async () => {
    const payload: OracleNodeHealth[] = [
      {
        nodeId: 'node-1',
        nodeAddress: 'GNODE1',
        status: 'online',
        uptimePct: 99.5,
        successRate: 100,
        avgLatencyMs: 210,
        submissionCount: 42,
        missedSubmissions: 0,
        lastSubmissionAt: new Date().toISOString(),
      },
    ];
    api.get.mockResolvedValue(payload);
    const result = await service.getOracleNodes();
    expect(result).toEqual(payload);
    expect(api.get).toHaveBeenCalledWith('/analytics/oracle-nodes');
  });

  it('getOracleNodes falls back to mock data when the request fails', async () => {
    api.get.mockRejectedValue(new Error('network'));
    const result = await service.getOracleNodes();
    expect(result.length).toBe(generateOracleNodes().length);
  });

  it('getOracleTimeseries forwards the range and node filters', async () => {
    const payload: OracleTimeseriesPoint[] = [
      { timestamp: new Date().toISOString(), success: 5, failed: 1, latencyMs: 220, uptimePct: 99 },
    ];
    api.get.mockResolvedValue(payload);
    const result = await service.getOracleTimeseries(30, 'node-aurora');
    expect(result).toEqual(payload);
    expect(api.get).toHaveBeenCalledWith('/analytics/oracle-metrics/timeseries', {
      params: { days: 30, nodeId: 'node-aurora' },
    });
  });

  it('getOracleTimeseries falls back to mock data when the request fails', async () => {
    api.get.mockRejectedValue(new Error('network'));
    const result = await service.getOracleTimeseries(7, 'node-aurora');
    expect(result.length).toBe(generateOracleTimeseries(7, 'node-aurora').length);
  });

  it('getOracleSubmissions maps the paginated payload and params', async () => {
    const payload: PaginatedOracleSubmissions = {
      data: [
        {
          id: 's1',
          nodeId: 'node-1',
          nodeAddress: 'G1',
          projectId: 'p1',
          status: 'success',
          latencyMs: 200,
          createdAt: new Date().toISOString(),
        },
      ],
      page: 2,
      totalPages: 5,
      total: 50,
    };
    api.get.mockResolvedValue(payload);
    const query: OracleSubmissionsQuery = {
      page: 2,
      limit: 10,
      nodeId: 'node-1',
      status: 'success',
    };
    const result = await service.getOracleSubmissions(query);
    expect(result).toEqual(payload);
    expect(api.get).toHaveBeenCalledWith('/analytics/oracle-submissions', { params: query });
  });

  it('getOracleSubmissions falls back to mock data when the request fails', async () => {
    api.get.mockRejectedValue(new Error('network'));
    const result = await service.getOracleSubmissions({ page: 1, limit: 10 });
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.totalPages).toBeGreaterThanOrEqual(1);
  });

  it('getOracleAnomalies maps the API payload', async () => {
    const payload: OracleAnomaly[] = [
      {
        id: 'a1',
        nodeId: 'node-1',
        nodeAddress: 'G1',
        type: 'high_latency',
        severity: 'warning',
        message: 'latency high',
        detectedAt: new Date().toISOString(),
      },
    ];
    api.get.mockResolvedValue(payload);
    const result = await service.getOracleAnomalies('node-1');
    expect(result).toEqual(payload);
    expect(api.get).toHaveBeenCalledWith('/analytics/oracle-anomalies', {
      params: { nodeId: 'node-1' },
    });
  });

  it('getOracleAnomalies falls back to mock data when the request fails', async () => {
    api.get.mockRejectedValue(new Error('network'));
    const result = await service.getOracleAnomalies();
    expect(result.length).toBe(generateOracleAnomalies().length);
  });
});
