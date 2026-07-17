import { createFeatureSelector, createSelector } from '@ngrx/store';
import { GovernanceState } from './governance.reducer';

export const selectGovernanceState = createFeatureSelector<GovernanceState>('governance');

export const selectProposals = createSelector(selectGovernanceState, (state) => state.proposals);

export const selectGovernanceTotal = createSelector(selectGovernanceState, (state) => state.total);
export const selectGovernancePage = createSelector(selectGovernanceState, (state) => state.page);
export const selectGovernanceTotalPages = createSelector(
  selectGovernanceState,
  (state) => state.totalPages,
);

export const selectSelectedProposal = createSelector(
  selectGovernanceState,
  (state) => state.selectedProposal,
);

export const selectGovernanceConfig = createSelector(
  selectGovernanceState,
  (state) => state.config,
);

export const selectProposalsLoading = createSelector(
  selectGovernanceState,
  (state) => state.loadingProposals,
);

export const selectProposalDetailLoading = createSelector(
  selectGovernanceState,
  (state) => state.loadingDetail,
);

export const selectGovernanceConfigLoading = createSelector(
  selectGovernanceState,
  (state) => state.loadingConfig,
);

export const selectGovernanceVoting = createSelector(
  selectGovernanceState,
  (state) => state.voting,
);

export const selectGovernanceExecuting = createSelector(
  selectGovernanceState,
  (state) => state.executing,
);

export const selectGovernanceCreating = createSelector(
  selectGovernanceState,
  (state) => state.creating,
);

export const selectGovernanceError = createSelector(selectGovernanceState, (state) => state.error);
