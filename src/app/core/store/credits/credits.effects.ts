import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, from } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import * as CreditsActions from './credits.actions';
import { CreditsService } from '../../services/credits.service';

@Injectable()
export class CreditsEffects {
  // Use inject() so dependencies are resolved before class field initialisers
  // run (avoids useDefineForClassFields ordering issues with ES2022+ targets).
  private readonly actions$ = inject(Actions);
  private readonly creditsService = inject(CreditsService);

  loadPortfolio$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CreditsActions.loadPortfolio),
      switchMap(() =>
        from(this.creditsService.getPortfolio()).pipe(
          map((portfolio) => CreditsActions.loadPortfolioSuccess({ portfolio })),
          catchError((err) =>
            of(
              CreditsActions.loadPortfolioFailure({
                error: err instanceof Error ? err.message : 'Failed to load portfolio',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  loadTransactions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(CreditsActions.loadTransactions),
      switchMap(({ projectId }) =>
        from(this.creditsService.getTransactions(projectId)).pipe(
          map((transactions) => CreditsActions.loadTransactionsSuccess({ transactions })),
          catchError((err) =>
            of(
              CreditsActions.loadTransactionsFailure({
                error: err instanceof Error ? err.message : 'Failed to load transactions',
              }),
            ),
          ),
        ),
      ),
    ),
  );
}
