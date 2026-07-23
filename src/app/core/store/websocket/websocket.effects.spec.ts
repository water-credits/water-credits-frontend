import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, Subject } from 'rxjs';
import { WebsocketEffects } from './websocket.effects';
import { WebsocketService } from '../../services/websocket.service';
import * as AuthActions from '../auth/auth.actions';
import * as WebsocketActions from './websocket.actions';
import { Action } from '@ngrx/store';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { selectAuthToken, selectCurrentUser } from '../auth/auth.selectors';
import { TestScheduler } from 'rxjs/testing';

describe('WebsocketEffects', () => {
  let actions$: Observable<Action>;
  let effects: WebsocketEffects;
  let wsServiceSpy: jasmine.SpyObj<WebsocketService>;
  let store: MockStore;
  let testScheduler: TestScheduler;
  let connectedSubject: Subject<boolean>;

  beforeEach(() => {
    connectedSubject = new Subject<boolean>();
    const spy = jasmine.createSpyObj('WebsocketService', ['connect', 'disconnect', 'emit', 'on'], {
      connected$: connectedSubject.asObservable()
    });
    spy.on.and.returnValue(new Subject<any>().asObservable());

    TestBed.configureTestingModule({
      providers: [
        WebsocketEffects,
        provideMockActions(() => actions$),
        provideMockStore({
          selectors: [
            { selector: selectAuthToken, value: 'mock-token' },
            { selector: selectCurrentUser, value: { id: 'mock-user-id' } }
          ]
        }),
        { provide: WebsocketService, useValue: spy }
      ]
    });

    effects = TestBed.inject(WebsocketEffects);
    wsServiceSpy = TestBed.inject(WebsocketService) as jasmine.SpyObj<WebsocketService>;
    store = TestBed.inject(MockStore);

    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('should dispatch wsConnect on loginSuccess', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      actions$ = hot('-a', { a: AuthActions.loginSuccess({ user: { id: 'test-id' } as any, token: 'token' }) });
      expectObservable(effects.connectOnAuth$).toBe('-b', { b: WebsocketActions.wsConnect({ token: 'token', userId: 'test-id' }) });
    });
  });

  it('should dispatch wsDisconnect on logout', () => {
    testScheduler.run(({ hot, expectObservable }) => {
      actions$ = hot('-a', { a: AuthActions.logout() });
      expectObservable(effects.disconnectOnAuth$).toBe('-b', { b: WebsocketActions.wsDisconnect() });
    });
  });

  // Reconnection and heartbeat tests can be more complex, but we assert the basics.
});
