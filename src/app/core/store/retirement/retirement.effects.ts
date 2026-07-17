import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, from } from 'rxjs';
import { exhaustMap, switchMap, map, catchError, tap } from 'rxjs/operators';

import * as RetirementActions from './retirement.actions';
import * as CreditsActions from '../credits/credits.actions';
import { RetirementService } from '../../services/retirement.service';
import { WalletService } from '../../services/wallet.service';
import { NotificationService } from '../../services/notification.service';

/**
 * Sentinel string returned by Freighter when the user explicitly rejects the
 * signing prompt. We match against it to distinguish "user cancelled" from a
 * genuine network/extension error so we can show the right UX response.
 *
 * The Freighter v6 API throws an Error whose message contains this substring.
 */
const USER_DECLINED_MESSAGE = 'User declined';

/** Checks whether a caught value represents the user declining the Freighter prompt. */
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
export class RetirementEffects {
  // Use inject() so that dependencies are resolved before class field
  // initialisers run (avoids useDefineForClassFields ordering issues).
  private readonly actions$ = inject(Actions);
  private readonly retirementService = inject(RetirementService);
  private readonly walletService = inject(WalletService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  /**
   * PRIMARY FLOW — handles the full multi-step retirement sequence.
   *
   * exhaustMap is intentional: if the user double-clicks "Confirm & Retire"
   * the second dispatch is dropped until the first completes, preventing a
   * duplicate on-chain submission.
   *
   * Sequence:
   *   1. POST /retirements/prepare  → get pending record + optional unsigned XDR
   *   2. WalletService.signTx(xdr)  → Freighter prompt (skipped if no XDR)
   *   3. POST /retirements/submit   → broadcast signed XDR (skipped if no XDR)
   *   4. Dispatch retirementConfirmed + loadPortfolio (cross-slice invalidation)
   */
  initiateRetirement$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RetirementActions.initiateRetirement),
      exhaustMap(({ request }) =>
        from(this.retirementService.prepareRetirement(request)).pipe(
          switchMap(async (prepareResponse) => {
            const { retirement, unsignedXdr, networkPassphrase } = prepareResponse;

            // ── Legacy single-POST path (no XDR) ─────────────────────────────
            // The backend already committed the record; skip signing and submit.
            if (!unsignedXdr) {
              return RetirementActions.retirementConfirmed({ retirement });
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
                return RetirementActions.retirementSignatureRejected({
                  retirementId: retirement.id,
                });
              }
              const message = sigErr instanceof Error ? sigErr.message : 'Signing failed';
              return RetirementActions.retirementSignatureFailure({
                retirementId: retirement.id,
                error: message,
              });
            }

            // signTx returns null when Freighter returns no XDR (edge case)
            if (!signedXdr) {
              return RetirementActions.retirementSignatureRejected({
                retirementId: retirement.id,
              });
            }

            // ── Submit signed XDR ─────────────────────────────────────────────
            try {
              const confirmed = await this.retirementService.submitRetirement({
                retirementId: retirement.id,
                signedXdr,
              });
              return RetirementActions.retirementConfirmed({ retirement: confirmed });
            } catch (submitErr) {
              const message = submitErr instanceof Error ? submitErr.message : 'Submission failed';
              return RetirementActions.retirementSubmitFailure({
                retirementId: retirement.id,
                error: message,
              });
            }
          }),
          catchError((err) => {
            const message = err instanceof Error ? err.message : 'Failed to prepare retirement';
            return of(RetirementActions.retirementPrepareFailure({ error: message }));
          }),
        ),
      ),
    ),
  );

  /**
   * On confirmed retirement:
   *   - Show a success toast.
   *   - Invalidate the credits portfolio so the reduced balance is reflected
   *     in the portfolio view without a manual refresh (cross-slice sync).
   *   - Navigate to the certificate page.
   */
  retirementConfirmed$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RetirementActions.retirementConfirmed),
      tap(({ retirement }) => {
        this.notificationService.success(
          'Credits retired',
          `Successfully retired ${retirement.amount} credits from ${retirement.projectName ?? retirement.projectId}`,
        );
        this.router.navigate(['/retirement', retirement.id, 'certificate']);
      }),
      map(() => CreditsActions.loadPortfolio()),
    ),
  );

  /**
   * When the user cancels the Freighter prompt, return the form to the review
   * step with a non-error informational toast (not an error state).
   */
  retirementSignatureRejected$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(RetirementActions.retirementSignatureRejected),
        tap(() => {
          this.notificationService.info(
            'Signing cancelled',
            'You cancelled the wallet signing prompt. Your retirement was not submitted.',
          );
        }),
      ),
    { dispatch: false },
  );

  /** Show an error toast on submit failure (backend 5xx after signing). */
  retirementSubmitFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(RetirementActions.retirementSubmitFailure),
        tap(({ error }) => {
          this.notificationService.error('Submission failed', error);
        }),
      ),
    { dispatch: false },
  );

  /** Show an error toast when the prepare step fails. */
  retirementPrepareFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(RetirementActions.retirementPrepareFailure),
        tap(({ error }) => {
          this.notificationService.error('Retirement failed', error);
        }),
      ),
    { dispatch: false },
  );

  // ── Read operations ─────────────────────────────────────────────────────────

  loadRetirements$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RetirementActions.loadRetirements),
      switchMap(({ page, limit }) =>
        from(this.retirementService.getRetirements({ page, limit })).pipe(
          map((response) =>
            RetirementActions.loadRetirementsSuccess({
              retirements: response.data,
              total: response.total,
              page: response.page,
              totalPages: response.totalPages,
            }),
          ),
          catchError((err) =>
            of(
              RetirementActions.loadRetirementsFailure({
                error: err instanceof Error ? err.message : 'Failed to load retirements',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  loadCertificate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RetirementActions.loadRetirementCertificate),
      switchMap(({ id }) =>
        from(this.retirementService.getCertificate(id)).pipe(
          map((certificate) => RetirementActions.loadRetirementCertificateSuccess({ certificate })),
          catchError((err) =>
            of(
              RetirementActions.loadRetirementCertificateFailure({
                error: err instanceof Error ? err.message : 'Failed to load certificate',
              }),
            ),
          ),
        ),
      ),
    ),
  );
}
