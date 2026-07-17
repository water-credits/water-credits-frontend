import { createAction, props } from '@ngrx/store';
import { CreditTransaction, CreditPortfolio } from '../../models/credit.model';

export const loadPortfolio = createAction('[Credits] Load Portfolio');
export const loadPortfolioSuccess = createAction(
  '[Credits] Load Portfolio Success',
  props<{ portfolio: CreditPortfolio }>(),
);
export const loadPortfolioFailure = createAction(
  '[Credits] Load Portfolio Failure',
  props<{ error: string }>(),
);

export const loadTransactions = createAction(
  '[Credits] Load Transactions',
  props<{ projectId?: string }>(),
);
export const loadTransactionsSuccess = createAction(
  '[Credits] Load Transactions Success',
  props<{ transactions: CreditTransaction[] }>(),
);
export const loadTransactionsFailure = createAction(
  '[Credits] Load Transactions Failure',
  props<{ error: string }>(),
);

/**
 * Clears the cached portfolio so the next `loadPortfolio` call fetches fresh
 * data. Dispatched automatically after a retirement is confirmed.
 */
export const invalidatePortfolio = createAction('[Credits] Invalidate Portfolio');
