import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CreditsState } from './credits.reducer';

export const selectCreditsState = createFeatureSelector<CreditsState>('credits');

export const selectPortfolio = createSelector(selectCreditsState, (state) => state.portfolio);
export const selectCreditBalances = createSelector(selectCreditsState, (state) => state.balances);
export const selectCreditTransactions = createSelector(
  selectCreditsState,
  (state) => state.transactions,
);
export const selectCreditsLoading = createSelector(selectCreditsState, (state) => state.loading);
export const selectCreditsError = createSelector(selectCreditsState, (state) => state.error);
export const selectPortfolioStale = createSelector(
  selectCreditsState,
  (state) => state.portfolioStale,
);
