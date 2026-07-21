import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, from } from 'rxjs';
import { switchMap, exhaustMap, map, catchError, tap } from 'rxjs/operators';

import * as MarketplaceActions from './marketplace.actions';
import { MarketplaceService } from '../../services/marketplace.service';
import { NotificationService } from '../../services/notification.service';

@Injectable()
export class MarketplaceEffects {
  private readonly actions$ = inject(Actions);
  private readonly marketplaceService = inject(MarketplaceService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  /** switchMap cancels any in-flight listings request on filter/page change. */
  loadListings$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MarketplaceActions.loadListings),
      switchMap(({ params }) =>
        from(this.marketplaceService.getListings(params)).pipe(
          map((response) => MarketplaceActions.loadListingsSuccess({ response })),
          catchError((err) =>
            of(
              MarketplaceActions.loadListingsFailure({
                error: err instanceof Error ? err.message : 'Failed to load listings',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  /**
   * switchMap: if the user navigates away and comes back to a different
   * project, the previous order-book request is cancelled.
   */
  loadOrderBook$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MarketplaceActions.loadOrderBook),
      switchMap(({ projectId }) =>
        from(this.marketplaceService.getOrderBook(projectId)).pipe(
          map((orderBook) => MarketplaceActions.loadOrderBookSuccess({ orderBook })),
          catchError((err) =>
            of(
              MarketplaceActions.loadOrderBookFailure({
                error: err instanceof Error ? err.message : 'Failed to load order book',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  /**
   * exhaustMap: prevents duplicate listing submissions if the user clicks
   * "Create Listing" twice while the request is in flight.
   */
  createListing$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MarketplaceActions.createListing),
      exhaustMap(({ data }) =>
        from(this.marketplaceService.createListing(data)).pipe(
          map((listing) => MarketplaceActions.createListingSuccess({ listing })),
          catchError((err) =>
            of(
              MarketplaceActions.createListingFailure({
                error: err instanceof Error ? err.message : 'Failed to create listing',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  // Purchase listing: build/sign/submit flow
  purchaseListing$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MarketplaceActions.purchaseListing),
      exhaustMap(({ listingId, quantity }) =>
        from(this.marketplaceService.buyListing(listingId, quantity)).pipe(
          map(() => MarketplaceActions.purchaseListingSuccess()),
          catchError((err) =>
            of(
              MarketplaceActions.purchaseListingFailure({
                error: err instanceof Error ? err.message : 'Failed to purchase listing',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  purchaseListingSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(MarketplaceActions.purchaseListingSuccess),
        tap(() => {
          this.notificationService.success('Purchase submitted', 'Your buy order was submitted');
          // refresh listings and user's portfolio
          this.router.navigate(['/marketplace']);
        }),
      ),
    { dispatch: false },
  );

  purchaseListingFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(MarketplaceActions.purchaseListingFailure),
        tap(({ error }) => this.notificationService.error('Failed to purchase', error)),
      ),
    { dispatch: false },
  );

  // Load my orders
  loadMyOrders$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MarketplaceActions.loadMyOrders),
      switchMap(() =>
        from(this.marketplaceService.getMyOrders()).pipe(
          map((response) => MarketplaceActions.loadMyOrdersSuccess({ response })),
          catchError((err) =>
            of(
              MarketplaceActions.loadMyOrdersFailure({
                error: err instanceof Error ? err.message : 'Failed to load orders',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  // Load price history
  loadPriceHistory$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MarketplaceActions.loadPriceHistory),
      switchMap(({ projectId }) =>
        from(this.marketplaceService.getPriceHistory(projectId)).pipe(
          map((data) => MarketplaceActions.loadPriceHistorySuccess({ data })),
          catchError((err) =>
            of(
              MarketplaceActions.loadPriceHistoryFailure({
                error: err instanceof Error ? err.message : 'Failed to load price history',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  createListingSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(MarketplaceActions.createListingSuccess),
        tap(() => {
          this.notificationService.success('Listing created', 'Your listing is now live');
          this.router.navigate(['/marketplace']);
        }),
      ),
    { dispatch: false },
  );

  createListingFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(MarketplaceActions.createListingFailure),
        tap(({ error }) => {
          this.notificationService.error('Failed to create listing', error);
        }),
      ),
    { dispatch: false },
  );
}
