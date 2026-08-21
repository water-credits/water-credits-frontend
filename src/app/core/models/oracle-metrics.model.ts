export type OracleStatus = 'online' | 'degraded' | 'offline';

export interface OracleNodeHealth {
  nodeId: string;
  nodeAddress: string;
  status: OracleStatus;
  uptimePct: number;
  successRate: number;
  avgLatencyMs: number;
  submissionCount: number;
  missedSubmissions: number;
  lastSubmissionAt: string;
}

export interface OracleTimeseriesPoint {
  timestamp: string;
  success: number;
  failed: number;
  latencyMs: number;
  uptimePct: number;
}

export type OracleAnomalyType = 'missed_submission' | 'high_latency' | 'low_success_rate';
export type AnomalySeverity = 'info' | 'warning' | 'critical';

export interface OracleAnomaly {
  id: string;
  nodeId: string;
  nodeAddress: string;
  type: OracleAnomalyType;
  severity: AnomalySeverity;
  message: string;
  detectedAt: string;
}

export interface OracleSubmissionHistoryItem {
  id: string;
  nodeId: string;
  nodeAddress: string;
  projectId: string;
  status: 'success' | 'failed';
  latencyMs: number;
  txHash?: string;
  createdAt: string;
}

export interface PaginatedOracleSubmissions {
  data: OracleSubmissionHistoryItem[];
  page: number;
  totalPages: number;
  total: number;
}

export interface OracleSubmissionsQuery {
  page?: number;
  limit?: number;
  nodeId?: string;
  status?: 'success' | 'failed';
}
