import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { switchMap, tap } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import * as AuthActions from './auth.actions';
import { AuthService } from '../../services/auth.service';
import { WalletService } from '../../services/wallet.service';
import { NotificationService } from '../../services/notification.service';
import { Router } from '@angular/router';
import { connectWalletSuccess } from '../wallet/wallet.actions';

@Injectable()
export class AuthEffects {
  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap(async () => {
        try {
          const wallet = await this.walletService.connect();
          if (!wallet) throw new Error('Wallet connection failed');
          this.store.dispatch(connectWalletSuccess({ address: wallet }));
          const { challenge } = await this.authService.requestChallenge(wallet);
          const signature = await this.walletService.signChallenge(challenge);
          if (!signature) throw new Error('Signature failed');
          const result = await this.authService.loginWithCreds(wallet, signature, challenge);
          return AuthActions.loginSuccess({ user: result.user, token: result.token });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Login failed';
          return AuthActions.loginFailure({ error: message });
        }
      }),
    ),
  );

  loginSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(({ user }) => {
          this.notificationService.success(
            'Welcome!',
            `Signed in as ${user.displayName || user.wallet}`,
          );
          this.router.navigateByUrl('/dashboard');
        }),
      ),
    { dispatch: false },
  );

  loginFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginFailure),
        tap(({ error }) => {
          this.notificationService.error('Login failed', error);
        }),
      ),
    { dispatch: false },
  );

  logout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logout),
        tap(() => {
          this.authService.logout();
          this.notificationService.info('Logged out', 'You have been signed out');
          this.router.navigateByUrl('/auth/login');
        }),
      ),
    { dispatch: false },
  );

  getCurrentUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.getCurrentUser),
      switchMap(async () => {
        try {
          const user = await this.authService.getCurrentUser();
          return AuthActions.getCurrentUserSuccess({ user });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch user';
          return AuthActions.getCurrentUserFailure({ error: message });
        }
      }),
    ),
  );

  constructor(
    private actions$: Actions,
    private store: Store,
    private authService: AuthService,
    private walletService: WalletService,
    private notificationService: NotificationService,
    private router: Router,
  ) {}
}
