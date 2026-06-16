export interface OracleSubmission {
  id: string;
  projectId: string;
  oracleAddress: string;
  nonce: number;
  txHash?: string;
  status: 'pending' | 'confirmed' | 'failed';
  readingsSnapshot: Record<string, number>;
  result?: {
    creditsGenerated: string;
    nRemoval: number;
    pRemoval: number;
    qualityPenalty: number;
    medianValues: Record<string, number>;
  };
  createdAt: string;
}

export interface OracleConfig {
  minOracles: number;
  maxOracles: number;
  submissionWindow: number;
  qualityPenaltyWeight: number;
  nRemovalWeight: number;
  pRemovalWeight: number;
}
