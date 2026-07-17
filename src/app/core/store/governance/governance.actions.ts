import { createAction, props } from '@ngrx/store';
import { Proposal, GovernanceConfig } from '../../models/proposal.model';

// ─── Load Config ─────────────────────────────────────────────────────────────
export const loadConfig = createAction('[Governance] Load Config');
export const loadConfigSuccess = createAction(
  '[Governance] Load Config Success',
  props<{ config: GovernanceConfig }>(),
);
export const loadConfigFailure = createAction(
  '[Governance] Load Config Failure',
  props<{ error: string }>(),
);

// ─── Load Proposals ──────────────────────────────────────────────────────────
export const loadProposals = createAction(
  '[Governance] Load Proposals',
  props<{ params?: { page?: number; limit?: number; status?: string } }>(),
);
export const loadProposalsSuccess = createAction(
  '[Governance] Load Proposals Success',
  props<{ proposals: Proposal[]; total: number; page: number; totalPages: number }>(),
);
export const loadProposalsFailure = createAction(
  '[Governance] Load Proposals Failure',
  props<{ error: string }>(),
);

// ─── Load Proposal Detail ────────────────────────────────────────────────────
export const loadProposalDetail = createAction(
  '[Governance] Load Proposal Detail',
  props<{ id: string }>(),
);
export const loadProposalDetailSuccess = createAction(
  '[Governance] Load Proposal Detail Success',
  props<{ proposal: Proposal }>(),
);
export const loadProposalDetailFailure = createAction(
  '[Governance] Load Proposal Detail Failure',
  props<{ error: string }>(),
);

// ─── Create Proposal ─────────────────────────────────────────────────────────
export const createProposal = createAction(
  '[Governance] Create Proposal',
  props<{
    data: {
      title: string;
      description: string;
      actionType: string;
      actionParams: Record<string, string | number | boolean>;
    };
  }>(),
);
export const createProposalSuccess = createAction(
  '[Governance] Create Proposal Success',
  props<{ proposal: Proposal }>(),
);
export const createProposalFailure = createAction(
  '[Governance] Create Proposal Failure',
  props<{ error: string }>(),
);

// ─── Cast Vote ───────────────────────────────────────────────────────────────
export const castVote = createAction(
  '[Governance] Cast Vote',
  props<{ proposalId: string; vote: 'for' | 'against' }>(),
);
export const castVotePrepared = createAction(
  '[Governance] Cast Vote Prepared',
  props<{
    proposalId: string;
    vote: 'for' | 'against';
    unsignedXdr?: string;
    networkPassphrase?: string;
  }>(),
);
export const castVoteSigned = createAction(
  '[Governance] Cast Vote Signed',
  props<{ proposalId: string; vote: 'for' | 'against'; signedXdr: string }>(),
);
export const castVoteSignatureRejected = createAction(
  '[Governance] Cast Vote Signature Rejected',
  props<{ proposalId: string }>(),
);
export const castVoteSignatureFailure = createAction(
  '[Governance] Cast Vote Signature Failure',
  props<{ proposalId: string; error: string }>(),
);
export const castVoteSuccess = createAction(
  '[Governance] Cast Vote Success',
  props<{ proposalId: string; proposal: Proposal; vote: 'for' | 'against' }>(),
);
export const castVoteFailure = createAction(
  '[Governance] Cast Vote Failure',
  props<{ error: string }>(),
);

// ─── Execute Proposal ────────────────────────────────────────────────────────
export const executeProposal = createAction(
  '[Governance] Execute Proposal',
  props<{ proposalId: string }>(),
);
export const executeProposalSuccess = createAction(
  '[Governance] Execute Proposal Success',
  props<{ proposalId: string; proposal: Proposal }>(),
);
export const executeProposalFailure = createAction(
  '[Governance] Execute Proposal Failure',
  props<{ error: string }>(),
);
