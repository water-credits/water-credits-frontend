import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, from } from 'rxjs';
import { exhaustMap, switchMap, map, catchError, tap } from 'rxjs/operators';

import * as GovernanceActions from './governance.actions';
import { GovernanceService } from '../../services/governance.service';
import { WalletService } from '../../services/wallet.service';
import { NotificationService } from '../../services/notification.service';

const USER_DECLINED_MESSAGE = 'User declined';

function isUserDeclined(err: unknown): boolean {
  if (err instanceof Error) {
    return (
      err.message.includes(USER_DECLINED_MESSAGE) ||
      err.message.toLowerCase().includes('declined') ||
      err.message.toLowerCase().includes('rejected') ||
      err.message.toLowerCase().includes('cancelled') ||
      err.message.toLowerCase().includes('canceled')
    );
  }
  return false;
}

@Injectable()
export class GovernanceEffects {
  private readonly actions$ = inject(Actions);
  private readonly governanceService = inject(GovernanceService);
  private readonly walletService = inject(WalletService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  loadConfig$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GovernanceActions.loadConfig),
      switchMap(() =>
        from(this.governanceService.getConfig()).pipe(
          map((config) => GovernanceActions.loadConfigSuccess({ config })),
          catchError((err) =>
            of(
              GovernanceActions.loadConfigFailure({
                error: err instanceof Error ? err.message : 'Failed to load configuration',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  loadProposals$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GovernanceActions.loadProposals),
      switchMap(({ params }) =>
        from(this.governanceService.getProposals(params)).pipe(
          map((response) =>
            GovernanceActions.loadProposalsSuccess({
              proposals: response.data || [],
              total: response.total || 0,
              page: response.page || 1,
              totalPages: response.totalPages || 1,
            }),
          ),
          catchError((err) =>
            of(
              GovernanceActions.loadProposalsFailure({
                error: err instanceof Error ? err.message : 'Failed to load proposals',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  loadProposalDetail$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GovernanceActions.loadProposalDetail),
      switchMap(({ id }) =>
        from(this.governanceService.getProposal(id)).pipe(
          map((proposal) => GovernanceActions.loadProposalDetailSuccess({ proposal })),
          catchError((err) =>
            of(
              GovernanceActions.loadProposalDetailFailure({
                error: err instanceof Error ? err.message : 'Failed to load proposal details',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  createProposal$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GovernanceActions.createProposal),
      exhaustMap(({ data }) =>
        from(this.governanceService.createProposal(data)).pipe(
          map((proposal) => GovernanceActions.createProposalSuccess({ proposal })),
          catchError((err) =>
            of(
              GovernanceActions.createProposalFailure({
                error: err instanceof Error ? err.message : 'Failed to create proposal',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  createProposalSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(GovernanceActions.createProposalSuccess),
        tap(({ proposal }) => {
          this.notificationService.success(
            'Proposal created',
            'Your proposal has been submitted successfully',
          );
          this.router.navigate(['/governance', proposal.id]);
        }),
      ),
    { dispatch: false },
  );

  createProposalFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(GovernanceActions.createProposalFailure),
        tap(({ error }) => {
          this.notificationService.error('Failed to create proposal', error);
        }),
      ),
    { dispatch: false },
  );

  castVote$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GovernanceActions.castVote),
      exhaustMap(({ proposalId, vote }) =>
        from(this.governanceService.prepareVote(proposalId, vote)).pipe(
          switchMap(async (prepareResponse) => {
            const { unsignedXdr, networkPassphrase, proposal } = prepareResponse;

            // ── Legacy single-POST path (no XDR) ─────────────────────────────
            if (!unsignedXdr) {
              const updatedProposal =
                proposal || (await this.governanceService.getProposal(proposalId));
              return GovernanceActions.castVoteSuccess({
                proposalId,
                proposal: updatedProposal,
                vote,
              });
            }

            // ── Two-phase path: sign the XDR ──────────────────────────────────
            let signedXdr: string | null;
            try {
              signedXdr = await this.walletService.signTx(
                unsignedXdr,
                'STELLAR',
                networkPassphrase,
              );
            } catch (sigErr) {
              if (isUserDeclined(sigErr)) {
                return GovernanceActions.castVoteSignatureRejected({ proposalId });
              }
              const message = sigErr instanceof Error ? sigErr.message : 'Signing failed';
              return GovernanceActions.castVoteSignatureFailure({ proposalId, error: message });
            }

            if (!signedXdr) {
              return GovernanceActions.castVoteSignatureRejected({ proposalId });
            }

            // ── Submit signed XDR ─────────────────────────────────────────────
            try {
              const updatedProposal = await this.governanceService.submitVote(
                proposalId,
                signedXdr,
              );
              return GovernanceActions.castVoteSuccess({
                proposalId,
                proposal: updatedProposal,
                vote,
              });
            } catch (submitErr) {
              const message = submitErr instanceof Error ? submitErr.message : 'Submission failed';
              return GovernanceActions.castVoteFailure({ error: message });
            }
          }),
          catchError((err) => {
            const message = err instanceof Error ? err.message : 'Failed to prepare vote';
            return of(GovernanceActions.castVoteFailure({ error: message }));
          }),
        ),
      ),
    ),
  );

  castVoteSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(GovernanceActions.castVoteSuccess),
        tap(({ proposal, vote }) => {
          this.notificationService.success('Vote cast', `You voted ${vote} on "${proposal.title}"`);
        }),
      ),
    { dispatch: false },
  );

  castVoteFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(GovernanceActions.castVoteFailure),
        tap(({ error }) => {
          this.notificationService.error('Vote failed', error);
        }),
      ),
    { dispatch: false },
  );

  castVoteSignatureRejected$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(GovernanceActions.castVoteSignatureRejected),
        tap(() => {
          this.notificationService.info(
            'Signing cancelled',
            'You cancelled the wallet signing prompt. Your vote was not submitted.',
          );
        }),
      ),
    { dispatch: false },
  );

  executeProposal$ = createEffect(() =>
    this.actions$.pipe(
      ofType(GovernanceActions.executeProposal),
      exhaustMap(({ proposalId }) =>
        from(this.governanceService.execute(proposalId)).pipe(
          switchMap(async () => {
            // After execution succeeds, load the updated proposal
            const updatedProposal = await this.governanceService.getProposal(proposalId);
            return GovernanceActions.executeProposalSuccess({
              proposalId,
              proposal: updatedProposal,
            });
          }),
          catchError((err) =>
            of(
              GovernanceActions.executeProposalFailure({
                error: err instanceof Error ? err.message : 'Failed to execute proposal',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  executeProposalSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(GovernanceActions.executeProposalSuccess),
        tap(({ proposal }) => {
          this.notificationService.success(
            'Proposal executed',
            `"${proposal.title}" has been executed`,
          );
        }),
      ),
    { dispatch: false },
  );

  executeProposalFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(GovernanceActions.executeProposalFailure),
        tap(({ error }) => {
          this.notificationService.error('Execution failed', error);
        }),
      ),
    { dispatch: false },
  );
}
