import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { from } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { concatLatestFrom } from '@ngrx/operators';

import * as AuthActions from '../auth/auth.actions';
import * as WalletActions from './wallet.actions';
import { WalletService } from '../../services/wallet.service';
import { selectWalletAddress } from './wallet.selectors';
import { AppState } from '../app.state';

/**
 * WalletEffects — reacts to auth lifecycle events and Freighter external
 * changes to keep WalletState.address in sync at all times.
 *
 * Responsibilities:
 *   1. Rehydration gap: when `loginSuccess` is dispatched (including from
 *      `rehydrateSession$`), call `walletService.checkConnection()` and
 *      dispatch `connectWalletSuccess` if Freighter is connected.
 *   2. Logout cleanup: clear WalletState.address on `logout` / `forceLogout`.
 *   3. External account switch: listen on `walletService.addressChange$` and
 *      update WalletState if the user switches Stellar accounts mid-session.
 *   4. External network switch: listen on `walletService.networkChange$` —
 *      currently no-op dispatch (reserved for a future network selector), but
 *      the Observable is wired in so that subclasses / future effects can
 *      extend it without re-wiring.
 *
 * What this class does NOT do:
 *   - It does not remove the `connectWalletSuccess` dispatches inside
 *     `AuthEffects.login$` and `AuthEffects.register$`. Those cover the
 *     initial connect before the server challenge round-trip. This class
 *     handles the rehydration and external-change paths only.
 *   - It does not inject Store to read a selector in a way that would
 *     recreate the DI cycle solved by SessionBusService. `concatLatestFrom`
 *     from `@ngrx/operators` is used for selective skipping (reads the store
 *     value at emission time without creating a nested subscription).
 */
@Injectable()
export class WalletEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store<AppState>);
  private readonly walletService = inject(WalletService);

  /**
   * On every `loginSuccess` (fresh login AND rehydrated session), attempt to
   * read the current Freighter address and populate WalletState.address.
   *
   * Guard: skip when WalletState.address is already set — this prevents a
   * redundant `connectWalletSuccess` dispatch when `AuthEffects.login$` has
   * already dispatched it before dispatching `loginSuccess` itself.
   *
   * Race condition handling: `checkConnection()` may return `false` if
   * Freighter hasn't finished initialising yet (especially during
   * `rehydrateSession$` which fires before the component tree renders).
   * In that case we silently do nothing — the user can always click the
   * "Connect Wallet" button in the header to reconnect manually.
   */
  rehydrateWalletOnLogin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginSuccess),
      // Read the current store value at emission time without subscribing.
      // If address is already populated (set by AuthEffects.login$ inline
      // dispatch), skip the checkConnection call entirely.
      concatLatestFrom(() => this.store.select(selectWalletAddress)),
      filter(([, currentAddress]) => currentAddress === null),
      switchMap(() =>
        from(this.walletService.checkConnection()).pipe(
          // checkConnection() returns true and sets publicKeySubject internally
          // when Freighter is connected. Retrieve the address it just set.
          map((isConnected) => {
            if (!isConnected) {
              // Freighter not yet initialised or not connected — do not
              // dispatch; avoids a spurious connectWalletFailure toast.
              return null;
            }
            const address = this.walletService.getStoredPublicKey();
            return address ? WalletActions.connectWalletSuccess({ address }) : null;
          }),
          filter(
            (action): action is ReturnType<typeof WalletActions.connectWalletSuccess> =>
              action !== null,
          ),
        ),
      ),
    ),
  );

  /**
   * On `logout` or `forceLogout`, dispatch `disconnectWallet` to clear
   * WalletState.address. This ensures the header's "Connect Wallet" button
   * is shown correctly after session expiry or manual logout.
   *
   * Note: `AuthEffects.logout$` already calls `walletService.disconnect()`
   * (which clears the publicKeySubject). This effect handles the NgRx store
   * slice to keep it consistent with the service layer.
   */
  clearWalletOnLogout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout, AuthActions.forceLogout),
      map(() => WalletActions.disconnectWallet()),
    ),
  );

  /**
   * Listens for mid-session account switches from the Freighter extension.
   * When the user changes their active Stellar account, update WalletState
   * so that subsequent transaction signing uses the correct address.
   *
   * `walletService.addressChange$` is `EMPTY` when Freighter v6 does not
   * expose the callback setter, so this effect is a no-op in that case.
   */
  syncAddressChange$ = createEffect(() =>
    this.walletService.addressChange$.pipe(
      map((address) => WalletActions.connectWalletSuccess({ address })),
    ),
  );
}
