import { createAction, props } from '@ngrx/store';
import { CreditBalance, CreditTransaction, CreditPortfolio } from '../../models/credit.model';

export const loadPortfolio = createAction('[Credits] Load Portfolio');
export const loadPortfolioSuccess = createAction('[Credits] Load Portfolio Success', props<{ portfolio: CreditPortfolio }>());
export const loadPortfolioFailure = createAction('[Credits] Load Portfolio Failure', props<{ error: string }>());

export const loadTransactions = createAction('[Credits] Load Transactions', props<{ projectId?: string }>());
export const loadTransactionsSuccess = createAction('[Credits] Load Transactions Success', props<{ transactions: CreditTransaction[] }>());
export const loadTransactionsFailure = createAction('[Credits] Load Transactions Failure', props<{ error: string }>());
