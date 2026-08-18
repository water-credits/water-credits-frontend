import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { Subject, firstValueFrom, EMPTY } from 'rxjs';
import { Action } from '@ngrx/store';

import { WalletEffects } from './wallet.effects';
import { WalletService } from '../../services/wallet.service';
import * as AuthActions from '../auth/auth.actions';
import * as WalletActions from './wallet.actions';
import { selectWalletAddress } from './wallet.selectors';
import { User, UserRole } from '../../models/user.model';

// ─── Test fixtures ─────────────────────────────────────────────────────────────

const mockUser: User = {
  id: 'user-1',
  wallet: 'GABC1234',
  email: 'test@example.com',
  displayName: 'Test User',
  role: UserRole.BUYER,
  isKycVerified: false,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockAddress = 'GABC1234STELLAR';
const mockToken = 'mock-jwt-token';

// ─── Mock shape ────────────────────────────────────────────────────────────────

interface WalletServiceMock {
  checkConnection: ReturnType<typeof vi.fn>;
  getStoredPublicKey: ReturnType<typeof vi.fn>;
  addressChange$: Subject<string> | typeof EMPTY;
  networkChange$: typeof EMPTY;
}

function buildWalletServiceMock(overrides: Partial<WalletServiceMock> = {}): WalletServiceMock {
  return {
    checkConnection: vi.fn(),
    getStoredPublicKey: vi.fn(),
    addressChange$: EMPTY,
    networkChange$: EMPTY,
    ...overrides,
  };
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('WalletEffects', () => {
  let effects: WalletEffects;
  let actions$: Subject<Action>;
  let store: MockStore;
  let walletServiceMock: WalletServiceMock;

  function setup(
    walletOverrides: Partial<WalletServiceMock> = {},
    initialWalletAddress: string | null = null,
  ): void {
    walletServiceMock = buildWalletServiceMock(walletOverrides);
    actions$ = new Subject<Action>();

    TestBed.configureTestingModule({
      providers: [
        WalletEffects,
        provideMockActions(() => actions$),
        provideMockStore({
          selectors: [{ selector: selectWalletAddress, value: initialWalletAddress }],
        }),
        { provide: WalletService, useValue: walletServiceMock },
      ],
    });

    effects = TestBed.inject(WalletEffects);
    store = TestBed.inject(MockStore);
  }

  afterEach(() => {
    vi.clearAllMocks();
    store?.resetSelectors();
  });

  // ── rehydrateWalletOnLogin$ ──────────────────────────────────────────────────

  describe('rehydrateWalletOnLogin$', () => {
    it('dispatches connectWalletSuccess when Freighter is connected and address is not yet set', async () => {
      setup(
        {
          checkConnection: vi.fn().mockResolvedValue(true),
          getStoredPublicKey: vi.fn().mockReturnValue(mockAddress),
        },
        null, // WalletState.address is null — rehydration needed
      );

      const resultPromise = firstValueFrom(effects.rehydrateWalletOnLogin$);
      actions$.next(AuthActions.loginSuccess({ user: mockUser, token: mockToken }));
      const action = await resultPromise;

      expect(action).toEqual(WalletActions.connectWalletSuccess({ address: mockAddress }));
      expect(walletServiceMock.checkConnection).toHaveBeenCalledTimes(1);
    });

    it('dispatches nothing when Freighter is not connected (race condition on rehydration)', async () => {
      setup(
        {
          checkConnection: vi.fn().mockResolvedValue(false),
          getStoredPublicKey: vi.fn().mockReturnValue(null),
        },
        null,
      );

      // Collect everything emitted for 50 ms — expect zero emissions.
      const emissions: Action[] = [];
      const sub = effects.rehydrateWalletOnLogin$.subscribe((a) => emissions.push(a));

      actions$.next(AuthActions.loginSuccess({ user: mockUser, token: mockToken }));

      // Let the async checkConnection() resolve and the effect pipeline tick.
      await new Promise((resolve) => setTimeout(resolve, 50));
      sub.unsubscribe();

      expect(emissions).toHaveLength(0);
      expect(walletServiceMock.checkConnection).toHaveBeenCalledTimes(1);
    });

    it('skips checkConnection when WalletState.address is already populated', async () => {
      // AuthEffects.login$ has already set the address before loginSuccess fired.
      setup(
        {
          checkConnection: vi.fn().mockResolvedValue(true),
          getStoredPublicKey: vi.fn().mockReturnValue(mockAddress),
        },
        mockAddress, // address already in store — skip
      );

      const emissions: Action[] = [];
      const sub = effects.rehydrateWalletOnLogin$.subscribe((a) => emissions.push(a));

      actions$.next(AuthActions.loginSuccess({ user: mockUser, token: mockToken }));
      await new Promise((resolve) => setTimeout(resolve, 50));
      sub.unsubscribe();

      // Effect should not call checkConnection and should not dispatch.
      expect(walletServiceMock.checkConnection).not.toHaveBeenCalled();
      expect(emissions).toHaveLength(0);
    });
  });

  // ── clearWalletOnLogout$ ─────────────────────────────────────────────────────

  describe('clearWalletOnLogout$', () => {
    it('dispatches disconnectWallet on AuthActions.logout', async () => {
      setup();

      const resultPromise = firstValueFrom(effects.clearWalletOnLogout$);
      actions$.next(AuthActions.logout());
      const action = await resultPromise;

      expect(action).toEqual(WalletActions.disconnectWallet());
    });

    it('dispatches disconnectWallet on AuthActions.forceLogout', async () => {
      setup();

      const resultPromise = firstValueFrom(effects.clearWalletOnLogout$);
      actions$.next(AuthActions.forceLogout());
      const action = await resultPromise;

      expect(action).toEqual(WalletActions.disconnectWallet());
    });
  });

  // ── syncAddressChange$ ───────────────────────────────────────────────────────

  describe('syncAddressChange$', () => {
    it('dispatches connectWalletSuccess when addressChange$ emits', async () => {
      const addressSubject = new Subject<string>();
      setup({ addressChange$: addressSubject });

      const resultPromise = firstValueFrom(effects.syncAddressChange$);
      addressSubject.next(mockAddress);
      const action = await resultPromise;

      expect(action).toEqual(WalletActions.connectWalletSuccess({ address: mockAddress }));
    });

    it('emits nothing when addressChange$ is EMPTY (WatchWalletChanges not available)', async () => {
      setup({ addressChange$: EMPTY });

      const emissions: Action[] = [];
      const sub = effects.syncAddressChange$.subscribe((a) => emissions.push(a));
      await new Promise((resolve) => setTimeout(resolve, 20));
      sub.unsubscribe();

      expect(emissions).toHaveLength(0);
    });
  });
});
