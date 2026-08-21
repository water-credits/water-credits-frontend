import {
  AnomalySeverity,
  OracleAnomaly,
  OracleAnomalyType,
  OracleNodeHealth,
  OracleSubmissionHistoryItem,
  OracleSubmissionsQuery,
  OracleTimeseriesPoint,
  PaginatedOracleSubmissions,
} from '../models/oracle-metrics.model';

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NODES = [
  { nodeId: 'node-aurora', nodeAddress: 'G AURORA NODE 1', status: 'online' as const },
  { nodeId: 'node-borealis', nodeAddress: 'G BOREALIS NODE 2', status: 'degraded' as const },
  { nodeId: 'node-cascade', nodeAddress: 'G CASCADE NODE 3', status: 'online' as const },
  { nodeId: 'node-delta', nodeAddress: 'G DELTA NODE 4', status: 'offline' as const },
];

const PROJECTS = ['proj-water-001', 'proj-water-002', 'proj-water-003', 'proj-water-004'];

function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function generateOracleNodes(): OracleNodeHealth[] {
  const rand = mulberry32(0x0ace15 >>> 0);
  return NODES.map((node, i) => {
    const successRate = i === 3 ? 0 : Math.round((82 + rand() * 17) * 10) / 10;
    const uptimePct = i === 3 ? 61.4 : Math.round((96 + rand() * 3.9) * 10) / 10;
    const avgLatencyMs = i === 1 ? 940 : Math.round(180 + rand() * 220);
    return {
      nodeId: node.nodeId,
      nodeAddress: node.nodeAddress,
      status: node.status,
      uptimePct,
      successRate,
      avgLatencyMs,
      submissionCount: Math.round(120 + rand() * 480),
      missedSubmissions: i === 3 ? 14 : Math.round(rand() * 4),
      lastSubmissionAt:
        i === 3
          ? new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString()
          : new Date(Date.now() - Math.round(rand() * 1000 * 60 * 30)).toISOString(),
    };
  });
}

export function generateOracleTimeseries(
  days = 30,
  nodeId?: string,
): OracleTimeseriesPoint[] {
  const seed = hashString(`ts:${nodeId ?? 'all'}:${days}`);
  const rand = mulberry32(seed);
  const points: OracleTimeseriesPoint[] = [];
  const now = Date.now();
  for (let d = days - 1; d >= 0; d--) {
    const timestamp = new Date(now - d * 24 * 60 * 60 * 1000).toISOString();
    const failed = Math.round(rand() * 6);
    const success = Math.round(20 + rand() * 60);
    const latencyMs = Math.round(160 + rand() * 360 + (nodeId === 'node-borealis' ? 300 : 0));
    const uptimePct = Math.round((nodeId === 'node-delta' ? 86 : 97 + rand() * 3) * 10) / 10;
    points.push({ timestamp, success, failed, latencyMs, uptimePct });
  }
  return points;
}

export function generateOracleSubmissions(
  query: OracleSubmissionsQuery = {},
): PaginatedOracleSubmissions {
  const { page = 1, limit = 10, nodeId, status } = query;
  const seed = hashString(`subs:${nodeId ?? 'all'}:${status ?? 'all'}`);
  const rand = mulberry32(seed);
  const total = 84;
  const all: OracleSubmissionHistoryItem[] = [];
  for (let i = 0; i < total; i++) {
    const node = NODES[Math.floor(rand() * NODES.length)];
    const isFailed = rand() < 0.12;
    const itemStatus: 'success' | 'failed' = isFailed ? 'failed' : 'success';
    if (nodeId && node.nodeId !== nodeId) continue;
    if (status && itemStatus !== status) continue;
    all.push({
      id: `sub-${i.toString().padStart(4, '0')}`,
      nodeId: node.nodeId,
      nodeAddress: node.nodeAddress,
      projectId: PROJECTS[Math.floor(rand() * PROJECTS.length)],
      status: itemStatus,
      latencyMs: Math.round(150 + rand() * 700),
      txHash: isFailed ? undefined : `0x${Math.floor(rand() * 1e16).toString(16)}`,
      createdAt: new Date(Date.now() - Math.round(rand() * 1000 * 60 * 60 * 24 * 30)).toISOString(),
    });
  }
  const start = (page - 1) * limit;
  const data = all.slice(start, start + limit);
  return {
    data,
    page,
    totalPages: Math.max(1, Math.ceil(all.length / limit)),
    total: all.length,
  };
}

export function generateOracleAnomalies(nodeId?: string): OracleAnomaly[] {
  const all = generateOracleNodes();
  const anomalies: OracleAnomaly[] = [];
  for (const node of all) {
    if (nodeId && node.nodeId !== nodeId) continue;
    if (node.missedSubmissions >= 10) {
      anomalies.push({
        id: `anom-${node.nodeId}-missed`,
        nodeId: node.nodeId,
        nodeAddress: node.nodeAddress,
        type: 'missed_submission',
        severity: 'critical' as AnomalySeverity,
        message: `${node.nodeId} missed ${node.missedSubmissions} submissions in the last window.`,
        detectedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      });
    }
    if (node.avgLatencyMs > 800) {
      anomalies.push({
        id: `anom-${node.nodeId}-latency`,
        nodeId: node.nodeId,
        nodeAddress: node.nodeAddress,
        type: 'high_latency',
        severity: 'warning' as AnomalySeverity,
        message: `${node.nodeId} average latency is ${node.avgLatencyMs}ms (threshold 800ms).`,
        detectedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      });
    }
    if (node.successRate < 90 && node.status !== 'offline') {
      anomalies.push({
        id: `anom-${node.nodeId}-success`,
        nodeId: node.nodeId,
        nodeAddress: node.nodeAddress,
        type: 'low_success_rate',
        severity: 'warning' as AnomalySeverity,
        message: `${node.nodeId} success rate is ${node.successRate}% (threshold 90%).`,
        detectedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      });
    }
  }
  return anomalies;
}

export function anomalyTypeLabel(type: OracleAnomalyType): string {
  switch (type) {
    case 'missed_submission':
      return 'Missed submission';
    case 'high_latency':
      return 'High latency';
    case 'low_success_rate':
      return 'Low success rate';
  }
}

export function severityRank(severity: AnomalySeverity): number {
  return severity === 'critical' ? 3 : severity === 'warning' ? 2 : 1;
}
