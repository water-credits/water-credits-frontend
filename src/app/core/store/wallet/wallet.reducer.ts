import { createReducer, on } from '@ngrx/store';
import * as WalletActions from './wallet.actions';

export interface WalletState {
  address: string | null;
  network: 'testnet' | 'public' | null;
  loading: boolean;
  error: string | null;
}

export const initialState: WalletState = {
  address: null,
  network: null,
  loading: false,
  error: null,
};

export const walletReducer = createReducer(
  initialState,
  on(WalletActions.connectWallet, (state) => ({ ...state, loading: true, error: null })),
  on(WalletActions.connectWalletSuccess, (state, { address, network }) => ({
    ...state,
    address,
    network: network !== undefined ? network : state.network,
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
    network: null,
  })),
  on(WalletActions.setNetwork, (state, { network }) => ({
    ...state,
    network,
  })),
);
