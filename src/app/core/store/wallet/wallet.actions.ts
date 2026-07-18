import { createAction, props } from '@ngrx/store';

export const connectWallet = createAction('[Wallet] Connect');
export const connectWalletSuccess = createAction(
  '[Wallet] Connect Success',
  props<{ address: string }>(),
);
export const connectWalletFailure = createAction(
  '[Wallet] Connect Failure',
  props<{ error: string }>(),
);

export const disconnectWallet = createAction('[Wallet] Disconnect');
