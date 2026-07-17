export interface Retirement {
  id: string;
  userId: string;
  userName?: string;
  projectId: string;
  projectName?: string;
  amount: string;
  purpose: string;
  metadataUri?: string;
  txHash?: string;
  certificateIpfsUri?: string;
  status: 'pending_signature' | 'pending' | 'confirmed' | 'failed';
  retiredAt: string;
}

export interface RetirementRequest {
  projectId: string;
  amount: string;
  purpose: string;
}

/**
 * Response from POST /retirements/prepare.
 *
 * If the backend implements a two-step flow it returns an unsigned XDR for the
 * client to sign. If it only supports a single POST it returns a `retirement`
 * record with status `pending_signature` and an optional `unsignedXdr` field
 * that the client can sign and submit separately.
 *
 * When `unsignedXdr` is absent the frontend skips the on-chain signing step
 * and treats the single REST record as the source of truth (legacy path).
 */
export interface RetirementPrepareResponse {
  /** Pending retirement record created by the backend. */
  retirement: Retirement;
  /**
   * Base64-encoded unsigned XDR of the Soroban contract invocation.
   * Present when the backend supports the two-step prepare/submit flow.
   * Absent when the backend uses the legacy single-POST flow — in that case
   * the retirement is already "confirmed" on the backend side.
   */
  unsignedXdr?: string;
  /** Stellar network passphrase needed by Freighter for correct signing. */
  networkPassphrase?: string;
}

/** Payload sent to POST /retirements/submit after Freighter signs the XDR. */
export interface RetirementSubmitRequest {
  retirementId: string;
  signedXdr: string;
}

export interface RetirementCertificate {
  id: string;
  projectName: string;
  amount: string;
  purpose: string;
  retiredAt: string;
  txHash: string;
  certificateIpfsUri: string;
  retireeAddress: string;
}

export interface RecentRetirement {
  projectName: string;
  amount: string;
  retiredAt: string;
}
