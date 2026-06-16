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
  status: 'pending' | 'confirmed' | 'failed';
  retiredAt: string;
}

export interface RetirementRequest {
  projectId: string;
  amount: string;
  purpose: string;
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
