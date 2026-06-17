import { createReducer, on } from '@ngrx/store';
import * as CreditsActions from './credits.actions';
import { CreditBalance, CreditTransaction, CreditPortfolio } from '../../models/credit.model';

export interface CreditsState {
  portfolio: CreditPortfolio | null;
  balances: CreditBalance[];
  transactions: CreditTransaction[];
  loading: boolean;
  error: string | null;
}

const initialState: CreditsState = {
  portfolio: null,
  balances: [],
  transactions: [],
  loading: false,
  error: null,
};

export const creditsReducer = createReducer(
  initialState,
  on(CreditsActions.loadPortfolio, (state) => ({ ...state, loading: true, error: null })),
  on(CreditsActions.loadPortfolioSuccess, (state, { portfolio }) => ({
    ...state,
    loading: false,
    portfolio,
    balances: portfolio.holdings,
  })),
  on(CreditsActions.loadPortfolioFailure, (state, { error }) => ({ ...state, loading: false, error })),
  on(CreditsActions.loadTransactions, (state) => ({ ...state, loading: true })),
  on(CreditsActions.loadTransactionsSuccess, (state, { transactions }) => ({ ...state, loading: false, transactions })),
  on(CreditsActions.loadTransactionsFailure, (state, { error }) => ({ ...state, loading: false, error })),
);
