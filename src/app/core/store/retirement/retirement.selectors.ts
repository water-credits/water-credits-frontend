import { createFeatureSelector, createSelector } from '@ngrx/store';
import { RetirementState } from './retirement.reducer';

export const selectRetirementState = createFeatureSelector<RetirementState>('retirement');

export const selectRetirements = createSelector(
  selectRetirementState,
  (state) => state.retirements,
);

export const selectRetirementTotal = createSelector(selectRetirementState, (state) => state.total);

export const selectRetirementPage = createSelector(selectRetirementState, (state) => state.page);

export const selectRetirementTotalPages = createSelector(
  selectRetirementState,
  (state) => state.totalPages,
);

export const selectActiveRetirement = createSelector(
  selectRetirementState,
  (state) => state.activeRetirement,
);

export const selectRetirementPhase = createSelector(selectRetirementState, (state) => state.phase);

export const selectRetirementLoading = createSelector(
  selectRetirementState,
  (state) => state.loading,
);

export const selectRetirementError = createSelector(selectRetirementState, (state) => state.error);

export const selectRetirementCertificate = createSelector(
  selectRetirementState,
  (state) => state.certificate,
);

/** Convenience: true while the wizard is anywhere between prepare and confirmed. */
export const selectIsRetirementInProgress = createSelector(
  selectRetirementPhase,
  (phase) => phase === 'preparing' || phase === 'awaiting_signature' || phase === 'submitting',
);

/** True only after the retirement has been confirmed on-chain. */
export const selectIsRetirementConfirmed = createSelector(
  selectRetirementPhase,
  (phase) => phase === 'confirmed',
);
