import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import {
  AnalyticsOverview,
  CreditsOverTimePoint,
  ProjectDistribution,
  RetirementByPurpose,
  TopProject,
  TopRetiree,
} from '../models/analytics.model';
import {
  OracleAnomaly,
  OracleNodeHealth,
  OracleSubmissionsQuery,
  OracleTimeseriesPoint,
  PaginatedOracleSubmissions,
} from '../models/oracle-metrics.model';
import {
  generateOracleAnomalies,
  generateOracleNodes,
  generateOracleSubmissions,
  generateOracleTimeseries,
} from './oracle-metrics.mock';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  constructor(private api: ApiService) {}

  async getOverview(): Promise<AnalyticsOverview> {
    return this.api.get<AnalyticsOverview>('/analytics/overview');
  }

  async getCreditsOverTime(days = 30): Promise<CreditsOverTimePoint[]> {
    return this.api.get<CreditsOverTimePoint[]>('/analytics/credits-over-time', {
      params: { days },
    });
  }

  async getProjectDistribution(): Promise<ProjectDistribution[]> {
    return this.api.get<ProjectDistribution[]>('/analytics/project-distribution');
  }

  async getRetirementByPurpose(): Promise<RetirementByPurpose[]> {
    return this.api.get<RetirementByPurpose[]>('/analytics/retirement-by-purpose');
  }

  async getTopProjects(limit = 5): Promise<TopProject[]> {
    return this.api.get<TopProject[]>('/analytics/top-projects', { params: { limit } });
  }

  async getTopRetirees(limit = 5): Promise<TopRetiree[]> {
    return this.api.get<TopRetiree[]>('/analytics/top-retirees', { params: { limit } });
  }

  async getOracleNodes(): Promise<OracleNodeHealth[]> {
    try {
      return await this.api.get<OracleNodeHealth[]>('/analytics/oracle-nodes');
    } catch {
      return generateOracleNodes();
    }
  }

  async getOracleTimeseries(days = 30, nodeId?: string): Promise<OracleTimeseriesPoint[]> {
    try {
      return await this.api.get<OracleTimeseriesPoint[]>('/analytics/oracle-metrics/timeseries', {
        params: { days, ...(nodeId ? { nodeId } : {}) },
      });
    } catch {
      return generateOracleTimeseries(days, nodeId);
    }
  }

  async getOracleSubmissions(
    query: OracleSubmissionsQuery = {},
  ): Promise<PaginatedOracleSubmissions> {
    try {
      return await this.api.get<PaginatedOracleSubmissions>('/analytics/oracle-submissions', {
        params: query as Record<string, unknown>,
      });
    } catch {
      return generateOracleSubmissions(query);
    }
  }

  async getOracleAnomalies(nodeId?: string): Promise<OracleAnomaly[]> {
    try {
      return await this.api.get<OracleAnomaly[]>('/analytics/oracle-anomalies', {
        params: nodeId ? { nodeId } : {},
      });
    } catch {
      return generateOracleAnomalies(nodeId);
    }
  }
}
