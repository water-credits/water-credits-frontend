import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { tap, mergeMap, switchMap, delay, map, withLatestFrom, filter } from 'rxjs/operators';
import { of, interval, EMPTY, concat } from 'rxjs';
import * as WebsocketActions from './websocket.actions';
import * as AuthActions from '../auth/auth.actions';
import { WebsocketService } from '../../services/websocket.service';
import { selectAuthToken, selectCurrentUser } from '../auth/auth.selectors';

const HEARTBEAT_INTERVAL = 30000;
const MAX_BACKOFF = 30000;
const MAX_MISSED_PONGS = 3;

@Injectable()
export class WebsocketEffects {
  private actions$ = inject(Actions);
  private wsService = inject(WebsocketService);
  private store = inject(Store);

  private attempt = 0;
  private missedPongs = 0;
  private intentionalDisconnect = true;

  connectOnAuth$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginSuccess),
      map(({ user, token }) => {
        // user.id might be undefined if it's a new user model, wallet is always there
        const userId = (user as any).id || user.wallet;
        return WebsocketActions.wsConnect({ token, userId });
      })
    )
  );

  disconnectOnAuth$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout, AuthActions.forceLogout),
      map(() => WebsocketActions.wsDisconnect())
    )
  );

  connect$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WebsocketActions.wsConnect),
      tap(({ token, userId }) => {
        this.intentionalDisconnect = false;
        this.wsService.connect(token, userId);
      })
    ),
    { dispatch: false }
  );

  disconnect$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WebsocketActions.wsDisconnect),
      tap(() => {
        this.intentionalDisconnect = true;
        this.wsService.disconnect();
      })
    ),
    { dispatch: false }
  );

  monitorConnection$ = createEffect(() =>
    this.wsService.connected$.pipe(
      filter(connected => !connected && !this.intentionalDisconnect),
      map(() => WebsocketActions.wsConnectionLost())
    )
  );

  heartbeat$ = createEffect(() =>
    this.wsService.connected$.pipe(
      switchMap(connected => {
        if (!connected) return EMPTY;
        this.attempt = 0; // reset attempt on successful connection
        this.missedPongs = 0;
        return interval(HEARTBEAT_INTERVAL).pipe(
          mergeMap(() => {
            this.missedPongs++;
            if (this.missedPongs >= MAX_MISSED_PONGS) {
              return of(WebsocketActions.wsConnectionLost());
            }
            return of(WebsocketActions.wsHeartbeatPing());
          })
        );
      })
    )
  );

  ping$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WebsocketActions.wsHeartbeatPing),
      tap(() => {
        this.wsService.emit('ping');
      })
    ),
    { dispatch: false }
  );

  pong$ = createEffect(() =>
    this.wsService.on('pong').pipe(
      map(() => WebsocketActions.wsHeartbeatPong())
    )
  );

  resetMissedPongs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WebsocketActions.wsHeartbeatPong),
      tap(() => {
        this.missedPongs = 0;
      })
    ),
    { dispatch: false }
  );

  reconnect$ = createEffect(() =>
    this.actions$.pipe(
      ofType(WebsocketActions.wsConnectionLost),
      withLatestFrom(this.store.select(selectAuthToken), this.store.select(selectCurrentUser)),
      filter(([_, token, user]) => !!token && !!user && !this.intentionalDisconnect),
      switchMap(([_, token, user]) => {
        const delayMs = Math.min(Math.pow(2, this.attempt) * 1000, MAX_BACKOFF);
        this.attempt++;
        
        const userId = (user as any).id || user!.wallet;
        
        return concat(
          of(WebsocketActions.wsReconnecting({ attempt: this.attempt, delay: delayMs })).pipe(
            tap(() => this.wsService.disconnect()) // Clean up dead socket before attempting again
          ),
          of(WebsocketActions.wsConnect({ token: token!, userId })).pipe(
            delay(delayMs)
          )
        );
      })
    )
  );
}
