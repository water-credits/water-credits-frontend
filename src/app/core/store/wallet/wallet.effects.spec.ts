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
  getStoredNetwork: ReturnType<typeof vi.fn>;
  normalizeNetwork: (net: string) => 'testnet' | 'public' | null;
  onAddressChange: ReturnType<typeof vi.fn>;
  onNetworkChange: ReturnType<typeof vi.fn>;
}

function buildWalletServiceMock(overrides: Partial<WalletServiceMock> = {}): WalletServiceMock {
  return {
    checkConnection: vi.fn(),
    getStoredPublicKey: vi.fn(),
    getStoredNetwork: vi.fn().mockReturnValue(null),
    normalizeNetwork: (net: string) => {
      if (!net) return null;
      const lower = net.toLowerCase();
      if (lower.includes('test') || lower === 'testnet') return 'testnet';
      if (lower.includes('public') || lower === 'public') return 'public';
      return null;
    },
    onAddressChange: vi.fn().mockReturnValue(EMPTY),
    onNetworkChange: vi.fn().mockReturnValue(EMPTY),
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
    it('dispatches connectWalletSuccess with address and network when Freighter is connected and address is not yet set', async () => {
      setup(
        {
          checkConnection: vi.fn().mockResolvedValue(true),
          getStoredPublicKey: vi.fn().mockReturnValue(mockAddress),
          getStoredNetwork: vi.fn().mockReturnValue('testnet'),
        },
        null, // WalletState.address is null — rehydration needed
      );

      const resultPromise = firstValueFrom(effects.rehydrateWalletOnLogin$);
      actions$.next(AuthActions.loginSuccess({ user: mockUser, token: mockToken }));
      const action = await resultPromise;

      expect(action).toEqual(
        WalletActions.connectWalletSuccess({ address: mockAddress, network: 'testnet' }),
      );
      expect(walletServiceMock.checkConnection).toHaveBeenCalledTimes(1);
    });

    it('dispatches nothing when Freighter is not connected (race condition on rehydration)', async () => {
      setup(
        {
          checkConnection: vi.fn().mockResolvedValue(false),
          getStoredPublicKey: vi.fn().mockReturnValue(null),
          getStoredNetwork: vi.fn().mockReturnValue(null),
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
    it('dispatches connectWalletSuccess when onAddressChange emits', async () => {
      const addressSubject = new Subject<string>();
      setup({
        onAddressChange: vi.fn().mockReturnValue(addressSubject),
        getStoredNetwork: vi.fn().mockReturnValue('testnet'),
      });

      const resultPromise = firstValueFrom(effects.syncAddressChange$);
      addressSubject.next(mockAddress);
      const action = await resultPromise;

      expect(action).toEqual(
        WalletActions.connectWalletSuccess({ address: mockAddress, network: 'testnet' }),
      );
    });

    it('emits nothing when onAddressChange is EMPTY (WatchWalletChanges not available)', async () => {
      setup({ onAddressChange: vi.fn().mockReturnValue(EMPTY) });

      const emissions: Action[] = [];
      const sub = effects.syncAddressChange$.subscribe((a) => emissions.push(a));
      await new Promise((resolve) => setTimeout(resolve, 20));
      sub.unsubscribe();

      expect(emissions).toHaveLength(0);
    });
  });

  // ── syncNetworkChange$ ───────────────────────────────────────────────────────

  describe('syncNetworkChange$', () => {
    it('dispatches setNetwork when onNetworkChange emits', async () => {
      const networkSubject = new Subject<string>();
      setup({ onNetworkChange: vi.fn().mockReturnValue(networkSubject) });

      const resultPromise = firstValueFrom(effects.syncNetworkChange$);
      networkSubject.next('TESTNET');
      const action = await resultPromise;

      expect(action).toEqual(WalletActions.setNetwork({ network: 'testnet' }));
    });

    it('emits nothing when onNetworkChange is EMPTY', async () => {
      setup({ onNetworkChange: vi.fn().mockReturnValue(EMPTY) });

      const emissions: Action[] = [];
      const sub = effects.syncNetworkChange$.subscribe((a) => emissions.push(a));
      await new Promise((resolve) => setTimeout(resolve, 20));
      sub.unsubscribe();

      expect(emissions).toHaveLength(0);
    });
  });
});
