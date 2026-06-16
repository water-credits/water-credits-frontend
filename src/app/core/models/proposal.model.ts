export enum ProposalStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXECUTED = 'executed',
  EXPIRED = 'expired',
}

export enum ProposalActionType {
  UPDATE_FEE = 'update_fee',
  UPDATE_CONFIG = 'update_config',
  ADD_MEMBER = 'add_member',
  REMOVE_MEMBER = 'remove_member',
  UPGRADE_CONTRACT = 'upgrade_contract',
}

export interface Proposal {
  id: string;
  proposerId: string;
  proposerName?: string;
  title: string;
  description: string;
  actionType: ProposalActionType;
  actionParams: Record<string, any>;
  votesFor: number;
  votesAgainst: number;
  status: ProposalStatus;
  deadline: string;
  createdAt: string;
  updatedAt: string;
}

export interface GovernanceConfig {
  protocolFee: number;
  voteDuration: number;
  timelockDuration: number;
  quorumThreshold: number;
  minOracleThreshold: number;
  qualityPenaltyWeight: number;
  nRemovalWeight: number;
  pRemovalWeight: number;
}
