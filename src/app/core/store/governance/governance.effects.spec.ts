import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { Subject, firstValueFrom } from 'rxjs';
import { Action } from '@ngrx/store';
import { provideRouter } from '@angular/router';

@Component({ standalone: true, template: '' })
class StubProposalDetailComponent {}

import { GovernanceEffects } from './governance.effects';
import { GovernanceService } from '../../services/governance.service';
import { WalletService } from '../../services/wallet.service';
import { NotificationService } from '../../services/notification.service';
import * as GovernanceActions from './governance.actions';
import {
  Proposal,
  GovernanceConfig,
  ProposalStatus,
  ProposalActionType,
} from '../../models/proposal.model';

// ─── Test fixtures ────────────────────────────────────────────────────────────

const mockConfig: GovernanceConfig = {
  protocolFee: 2,
  voteDuration: 72,
  timelockDuration: 24,
  quorumThreshold: 50,
  minOracleThreshold: 3,
  qualityPenaltyWeight: 1,
  nRemovalWeight: 1,
  pRemovalWeight: 1,
};

const mockProposal: Proposal = {
  id: 'prop-001',
  proposerId: 'user-1',
  title: 'Test Proposal',
  description: 'Test Description',
  actionType: ProposalActionType.UPDATE_FEE,
  actionParams: { fee: 3 },
  votesFor: 100,
  votesAgainst: 50,
  status: ProposalStatus.ACTIVE,
  deadline: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockUnsignedXdr = 'AAAAAQAA...unsignedxdr==';
const mockSignedXdr = 'AAAASIGN...signedxdr==';
const mockNetworkPassphrase = 'Test SDF Network ; September 2015';

const mockPrepareResponseWithXdr = {
  unsignedXdr: mockUnsignedXdr,
  networkPassphrase: mockNetworkPassphrase,
  proposal: mockProposal,
};

const mockPrepareResponseLegacy = {
  proposal: {
    ...mockProposal,
    votesFor: 101, // updated vote count
  },
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('GovernanceEffects', () => {
  let effects: GovernanceEffects;
  let actions$: Subject<Action>;

  const governanceServiceMock = {
    getConfig: vi.fn(),
    getProposals: vi.fn(),
    getProposal: vi.fn(),
    createProposal: vi.fn(),
    prepareVote: vi.fn(),
    submitVote: vi.fn(),
    execute: vi.fn(),
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

    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        GovernanceEffects,
        provideRouter([{ path: 'governance/:id', component: StubProposalDetailComponent }]),
        provideStore({}),
        provideMockActions(() => actions$),
        { provide: GovernanceService, useValue: governanceServiceMock },
        { provide: WalletService, useValue: walletServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
      ],
    });

    effects = TestBed.inject(GovernanceEffects);
  });

  // ── Load Config ─────────────────────────────────────────────────────────────
  describe('loadConfig$', () => {
    it('emits loadConfigSuccess on success', async () => {
      governanceServiceMock.getConfig.mockResolvedValue(mockConfig);

      const resultPromise = firstValueFrom(effects.loadConfig$);
      actions$.next(GovernanceActions.loadConfig());
      const action = await resultPromise;

      expect(action).toEqual(GovernanceActions.loadConfigSuccess({ config: mockConfig }));
      expect(governanceServiceMock.getConfig).toHaveBeenCalled();
    });

    it('emits loadConfigFailure on error', async () => {
      governanceServiceMock.getConfig.mockRejectedValue(new Error('Load error'));

      const resultPromise = firstValueFrom(effects.loadConfig$);
      actions$.next(GovernanceActions.loadConfig());
      const action = await resultPromise;

      expect(action).toEqual(GovernanceActions.loadConfigFailure({ error: 'Load error' }));
    });
  });

  // ── Load Proposals ──────────────────────────────────────────────────────────
  describe('loadProposals$', () => {
    it('emits loadProposalsSuccess on success', async () => {
      const mockResponse = { data: [mockProposal], total: 1, page: 1, totalPages: 1 };
      governanceServiceMock.getProposals.mockResolvedValue(mockResponse);

      const resultPromise = firstValueFrom(effects.loadProposals$);
      actions$.next(GovernanceActions.loadProposals({}));
      const action = await resultPromise;

      expect(action).toEqual(
        GovernanceActions.loadProposalsSuccess({
          proposals: [mockProposal],
          total: 1,
          page: 1,
          totalPages: 1,
        }),
      );
    });
  });

  // ── Cast Vote ───────────────────────────────────────────────────────────────
  describe('castVote$ — happy path (two-step flow)', () => {
    it('prepares, signs, submits, and emits castVoteSuccess', async () => {
      const updatedProposal = { ...mockProposal, votesFor: 101 };
      governanceServiceMock.prepareVote.mockResolvedValue(mockPrepareResponseWithXdr);
      walletServiceMock.signTx.mockResolvedValue(mockSignedXdr);
      governanceServiceMock.submitVote.mockResolvedValue(updatedProposal);

      const resultPromise = firstValueFrom(effects.castVote$);
      actions$.next(GovernanceActions.castVote({ proposalId: 'prop-001', vote: 'for' }));
      const action = await resultPromise;

      expect(action).toEqual(
        GovernanceActions.castVoteSuccess({
          proposalId: 'prop-001',
          proposal: updatedProposal,
          vote: 'for',
        }),
      );
      expect(governanceServiceMock.prepareVote).toHaveBeenCalledWith('prop-001', 'for');
      expect(walletServiceMock.signTx).toHaveBeenCalledWith(
        mockUnsignedXdr,
        'STELLAR',
        mockNetworkPassphrase,
      );
      expect(governanceServiceMock.submitVote).toHaveBeenCalledWith('prop-001', mockSignedXdr);
    });
  });

  describe('castVote$ — legacy single-POST path', () => {
    it('skips signing and emits castVoteSuccess directly', async () => {
      const updatedProposal = mockPrepareResponseLegacy.proposal;
      governanceServiceMock.prepareVote.mockResolvedValue(mockPrepareResponseLegacy);

      const resultPromise = firstValueFrom(effects.castVote$);
      actions$.next(GovernanceActions.castVote({ proposalId: 'prop-001', vote: 'for' }));
      const action = await resultPromise;

      expect(action).toEqual(
        GovernanceActions.castVoteSuccess({
          proposalId: 'prop-001',
          proposal: updatedProposal,
          vote: 'for',
        }),
      );
      expect(walletServiceMock.signTx).not.toHaveBeenCalled();
      expect(governanceServiceMock.submitVote).not.toHaveBeenCalled();
    });
  });

  describe('castVote$ — user declines Freighter', () => {
    it('emits castVoteSignatureRejected', async () => {
      governanceServiceMock.prepareVote.mockResolvedValue(mockPrepareResponseWithXdr);
      walletServiceMock.signTx.mockRejectedValue(new Error('User declined'));

      const resultPromise = firstValueFrom(effects.castVote$);
      actions$.next(GovernanceActions.castVote({ proposalId: 'prop-001', vote: 'for' }));
      const action = await resultPromise;

      expect(action).toEqual(
        GovernanceActions.castVoteSignatureRejected({ proposalId: 'prop-001' }),
      );
    });
  });
});
