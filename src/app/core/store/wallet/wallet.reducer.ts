import { createReducer, on } from '@ngrx/store';
import * as WalletActions from './wallet.actions';

export interface WalletState {
  address: string | null;
  loading: boolean;
  error: string | null;
}

export const initialState: WalletState = {
  address: null,
  loading: false,
  error: null,
};

export const walletReducer = createReducer(
  initialState,
  on(WalletActions.connectWallet, (state) => ({ ...state, loading: true, error: null })),
  on(WalletActions.connectWalletSuccess, (state, { address }) => ({
    ...state,
    address,
    loading: false,
  })),
  on(WalletActions.connectWalletFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
  on(WalletActions.disconnectWallet, (state) => ({
    ...state,
    address: null,
  })),
);
