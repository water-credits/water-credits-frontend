import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { Subject, firstValueFrom } from 'rxjs';
import { Action } from '@ngrx/store';
import { provideRouter } from '@angular/router';

/** Minimal stub component to satisfy the router for navigation in effects. */
@Component({ standalone: true, template: '' })
class StubCertificateComponent {}

import { RetirementEffects } from './retirement.effects';
import { RetirementService } from '../../services/retirement.service';
import { WalletService } from '../../services/wallet.service';
import { NotificationService } from '../../services/notification.service';
import * as RetirementActions from './retirement.actions';
import * as CreditsActions from '../credits/credits.actions';
import { Retirement, RetirementPrepareResponse } from '../../models/retirement.model';

// ─── Test fixtures ────────────────────────────────────────────────────────────

const mockRetirement: Retirement = {
  id: 'ret-001',
  userId: 'user-1',
  projectId: 'proj-1',
  projectName: 'Green Valley',
  amount: '1000',
  purpose: 'Voluntary Retirement',
  status: 'pending_signature',
  retiredAt: new Date().toISOString(),
};

const mockConfirmedRetirement: Retirement = {
  ...mockRetirement,
  status: 'confirmed',
  txHash: 'abc123deadbeef',
};

const mockUnsignedXdr = 'AAAAAQAA...base64xdr==';
const mockSignedXdr = 'AAAASIGN...base64xdr==';
const mockNetworkPassphrase = 'Test SDF Network ; September 2015';

const mockPrepareResponseWithXdr: RetirementPrepareResponse = {
  retirement: mockRetirement,
  unsignedXdr: mockUnsignedXdr,
  networkPassphrase: mockNetworkPassphrase,
};

const mockPrepareResponseLegacy: RetirementPrepareResponse = {
  // No unsignedXdr — legacy single-POST path; backend already committed
  retirement: { ...mockConfirmedRetirement, status: 'confirmed' },
};

const mockRequest = {
  projectId: 'proj-1',
  amount: '1000',
  purpose: 'Voluntary Retirement',
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RetirementEffects', () => {
  let effects: RetirementEffects;
  let actions$: Subject<Action>;

  const retirementServiceMock = {
    prepareRetirement: vi.fn(),
    submitRetirement: vi.fn(),
    getCertificate: vi.fn(),
    getRetirements: vi.fn(),
  };

  const walletServiceMock = { signTx: vi.fn() };

  const notificationServiceMock = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  };

  beforeEach(() => {
    actions$ = new Subject<Action>();

    // Reset all mocks between tests
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        RetirementEffects,
        provideRouter([
          { path: 'retirement/:id/certificate', component: StubCertificateComponent },
        ]),
        provideStore({}),
        provideMockActions(() => actions$),
        { provide: RetirementService, useValue: retirementServiceMock },
        { provide: WalletService, useValue: walletServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
      ],
    });

    effects = TestBed.inject(RetirementEffects);
  });

  // ── Happy path: two-step flow ───────────────────────────────────────────────

  describe('initiateRetirement$ — happy path (two-step flow)', () => {
    it('prepares, signs, submits, and emits retirementConfirmed', async () => {
      retirementServiceMock.prepareRetirement.mockResolvedValue(mockPrepareResponseWithXdr);
      walletServiceMock.signTx.mockResolvedValue(mockSignedXdr);
      retirementServiceMock.submitRetirement.mockResolvedValue(mockConfirmedRetirement);

      const resultPromise = firstValueFrom(effects.initiateRetirement$);
      actions$.next(RetirementActions.initiateRetirement({ request: mockRequest }));
      const action = await resultPromise;

      expect(action).toEqual(
        RetirementActions.retirementConfirmed({ retirement: mockConfirmedRetirement }),
      );
      expect(retirementServiceMock.prepareRetirement).toHaveBeenCalledWith(mockRequest);
      expect(walletServiceMock.signTx).toHaveBeenCalledWith(
        mockUnsignedXdr,
        'STELLAR',
        mockNetworkPassphrase,
      );
      expect(retirementServiceMock.submitRetirement).toHaveBeenCalledWith({
        retirementId: mockRetirement.id,
        signedXdr: mockSignedXdr,
      });
    });
  });

  // ── Legacy single-POST path (no XDR) ───────────────────────────────────────

  describe('initiateRetirement$ — legacy single-POST path (no XDR)', () => {
    it('skips signing and emits retirementConfirmed directly', async () => {
      retirementServiceMock.prepareRetirement.mockResolvedValue(mockPrepareResponseLegacy);

      const resultPromise = firstValueFrom(effects.initiateRetirement$);
      actions$.next(RetirementActions.initiateRetirement({ request: mockRequest }));
      const action = await resultPromise;

      expect(action).toEqual(
        RetirementActions.retirementConfirmed({
          retirement: mockPrepareResponseLegacy.retirement,
        }),
      );
      expect(walletServiceMock.signTx).not.toHaveBeenCalled();
      expect(retirementServiceMock.submitRetirement).not.toHaveBeenCalled();
    });
  });

  // ── User rejects Freighter prompt ───────────────────────────────────────────

  describe('initiateRetirement$ — user declines Freighter prompt', () => {
    it('emits retirementSignatureRejected (not an error action)', async () => {
      retirementServiceMock.prepareRetirement.mockResolvedValue(mockPrepareResponseWithXdr);
      walletServiceMock.signTx.mockRejectedValue(new Error('User declined the signing request'));

      const resultPromise = firstValueFrom(effects.initiateRetirement$);
      actions$.next(RetirementActions.initiateRetirement({ request: mockRequest }));
      const action = await resultPromise;

      expect(action).toEqual(
        RetirementActions.retirementSignatureRejected({ retirementId: mockRetirement.id }),
      );
      // submit must NOT be called after user rejection
      expect(retirementServiceMock.submitRetirement).not.toHaveBeenCalled();
    });

    it('emits retirementSignatureRejected when signTx returns null', async () => {
      retirementServiceMock.prepareRetirement.mockResolvedValue(mockPrepareResponseWithXdr);
      walletServiceMock.signTx.mockResolvedValue(null);

      const resultPromise = firstValueFrom(effects.initiateRetirement$);
      actions$.next(RetirementActions.initiateRetirement({ request: mockRequest }));
      const action = await resultPromise;

      expect(action).toEqual(
        RetirementActions.retirementSignatureRejected({ retirementId: mockRetirement.id }),
      );
    });
  });

  // ── Backend fails after signing (5xx) ──────────────────────────────────────

  describe('initiateRetirement$ — backend fails after signing', () => {
    it('emits retirementSubmitFailure with the error message', async () => {
      retirementServiceMock.prepareRetirement.mockResolvedValue(mockPrepareResponseWithXdr);
      walletServiceMock.signTx.mockResolvedValue(mockSignedXdr);
      retirementServiceMock.submitRetirement.mockRejectedValue(new Error('Internal server error'));

      const resultPromise = firstValueFrom(effects.initiateRetirement$);
      actions$.next(RetirementActions.initiateRetirement({ request: mockRequest }));
      const action = await resultPromise;

      expect(action).toEqual(
        RetirementActions.retirementSubmitFailure({
          retirementId: mockRetirement.id,
          error: 'Internal server error',
        }),
      );
    });
  });

  // ── Prepare step fails ──────────────────────────────────────────────────────

  describe('initiateRetirement$ — prepare step fails', () => {
    it('emits retirementPrepareFailure with the error message', async () => {
      retirementServiceMock.prepareRetirement.mockRejectedValue(new Error('Network error'));

      const resultPromise = firstValueFrom(effects.initiateRetirement$);
      actions$.next(RetirementActions.initiateRetirement({ request: mockRequest }));
      const action = await resultPromise;

      expect(action).toEqual(
        RetirementActions.retirementPrepareFailure({ error: 'Network error' }),
      );
    });
  });

  // ── exhaustMap deduplication ────────────────────────────────────────────────

  describe('initiateRetirement$ — exhaustMap deduplication', () => {
    it('processes only the first dispatch and ignores the second while in flight', async () => {
      // Delay first-call resolution so the second dispatch arrives mid-flight.
      let resolveFirst!: (v: RetirementPrepareResponse) => void;
      const firstCallPromise = new Promise<RetirementPrepareResponse>((res) => {
        resolveFirst = res;
      });

      retirementServiceMock.prepareRetirement
        .mockReturnValueOnce(firstCallPromise)
        .mockResolvedValue(mockPrepareResponseLegacy); // second call — should be dropped

      const resultPromise = firstValueFrom(effects.initiateRetirement$);

      // Two rapid dispatches before the first effect resolves
      actions$.next(RetirementActions.initiateRetirement({ request: mockRequest }));
      actions$.next(RetirementActions.initiateRetirement({ request: mockRequest }));

      // Yield to let the scheduler process both, then resolve the first.
      await new Promise((r) => setTimeout(r, 10));
      resolveFirst(mockPrepareResponseLegacy);

      await resultPromise;

      // exhaustMap must have dropped the second dispatch — exactly one call.
      expect(retirementServiceMock.prepareRetirement).toHaveBeenCalledTimes(1);
    });
  });

  // ── Cross-slice portfolio reload ────────────────────────────────────────────

  describe('retirementConfirmed$ — cross-slice portfolio reload', () => {
    it('dispatches loadPortfolio after a confirmed retirement', async () => {
      const resultPromise = firstValueFrom(effects.retirementConfirmed$);
      actions$.next(RetirementActions.retirementConfirmed({ retirement: mockConfirmedRetirement }));
      const action = await resultPromise;

      expect(action).toEqual(CreditsActions.loadPortfolio());
    });

    it('shows a success notification containing the amount', async () => {
      const resultPromise = firstValueFrom(effects.retirementConfirmed$);
      actions$.next(RetirementActions.retirementConfirmed({ retirement: mockConfirmedRetirement }));
      await resultPromise;

      expect(notificationServiceMock.success).toHaveBeenCalledWith(
        'Credits retired',
        expect.stringContaining('1000'),
      );
    });
  });

  // ── Signature-rejected notification ─────────────────────────────────────────

  describe('retirementSignatureRejected$ — shows informational toast', () => {
    it('shows an info notification and not an error', async () => {
      const resultPromise = firstValueFrom(effects.retirementSignatureRejected$);
      actions$.next(
        RetirementActions.retirementSignatureRejected({ retirementId: mockRetirement.id }),
      );
      await resultPromise;

      expect(notificationServiceMock.info).toHaveBeenCalledWith(
        'Signing cancelled',
        expect.any(String),
      );
      expect(notificationServiceMock.error).not.toHaveBeenCalled();
    });
  });
});
