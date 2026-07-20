import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { Subject, firstValueFrom } from 'rxjs';
import { Action } from '@ngrx/store';
import { provideRouter } from '@angular/router';

@Component({ standalone: true, template: '' })
class StubMarketplaceComponent {}

import { MarketplaceEffects } from './marketplace.effects';
import {
  MarketplaceService,
  MarketplaceListing,
  OrderBook,
} from '../../services/marketplace.service';
import { NotificationService } from '../../services/notification.service';
import * as MarketplaceActions from './marketplace.actions';

// ─── Test fixtures ────────────────────────────────────────────────────────────

const mockListing: MarketplaceListing = {
  id: 'listing-001',
  projectId: 'proj-1',
  projectName: 'Green Valley',
  sellerId: 'user-1',
  amount: '5000',
  price: 2.5,
  totalValue: 12500,
  status: 'active',
  createdAt: new Date().toISOString(),
};

const mockPaginatedListings = {
  data: [mockListing],
  total: 1,
  page: 1,
  limit: 10,
  totalPages: 1,
};

const mockOrderBook: OrderBook = {
  asks: [{ price: 3.0, amount: '1000', total: '3000', count: 1 }],
  bids: [{ price: 2.0, amount: '2000', total: '4000', count: 2 }],
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('MarketplaceEffects', () => {
  let effects: MarketplaceEffects;
  let actions$: Subject<Action>;

  const marketplaceServiceMock = {
    getListings: vi.fn(),
    getOrderBook: vi.fn(),
    createListing: vi.fn(),
  };

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
        MarketplaceEffects,
        provideRouter([{ path: 'marketplace', component: StubMarketplaceComponent }]),
        provideStore({}),
        provideMockActions(() => actions$),
        { provide: MarketplaceService, useValue: marketplaceServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
      ],
    });

    effects = TestBed.inject(MarketplaceEffects);
  });

  // ── Load Listings ───────────────────────────────────────────────────────────

  describe('loadListings$', () => {
    it('emits loadListingsSuccess on success', async () => {
      marketplaceServiceMock.getListings.mockResolvedValue(mockPaginatedListings);

      const resultPromise = firstValueFrom(effects.loadListings$);
      actions$.next(MarketplaceActions.loadListings({}));
      const action = await resultPromise;

      expect(action).toEqual(
        MarketplaceActions.loadListingsSuccess({ response: mockPaginatedListings }),
      );
      expect(marketplaceServiceMock.getListings).toHaveBeenCalled();
    });

    it('emits loadListingsFailure on error', async () => {
      marketplaceServiceMock.getListings.mockRejectedValue(new Error('Network error'));

      const resultPromise = firstValueFrom(effects.loadListings$);
      actions$.next(MarketplaceActions.loadListings({}));
      const action = await resultPromise;

      expect(action).toEqual(MarketplaceActions.loadListingsFailure({ error: 'Network error' }));
    });

    it('passes filters to the service', async () => {
      marketplaceServiceMock.getListings.mockResolvedValue(mockPaginatedListings);

      const resultPromise = firstValueFrom(effects.loadListings$);
      actions$.next(
        MarketplaceActions.loadListings({ params: { status: 'active', page: 2, limit: 10 } }),
      );
      await resultPromise;

      expect(marketplaceServiceMock.getListings).toHaveBeenCalledWith({
        status: 'active',
        page: 2,
        limit: 10,
      });
    });
  });

  // ── Load Order Book ─────────────────────────────────────────────────────────

  describe('loadOrderBook$', () => {
    it('emits loadOrderBookSuccess on success', async () => {
      marketplaceServiceMock.getOrderBook.mockResolvedValue(mockOrderBook);

      const resultPromise = firstValueFrom(effects.loadOrderBook$);
      actions$.next(MarketplaceActions.loadOrderBook({ projectId: 'proj-1' }));
      const action = await resultPromise;

      expect(action).toEqual(MarketplaceActions.loadOrderBookSuccess({ orderBook: mockOrderBook }));
      expect(marketplaceServiceMock.getOrderBook).toHaveBeenCalledWith('proj-1');
    });

    it('emits loadOrderBookFailure on error', async () => {
      marketplaceServiceMock.getOrderBook.mockRejectedValue(new Error('Failed'));

      const resultPromise = firstValueFrom(effects.loadOrderBook$);
      actions$.next(MarketplaceActions.loadOrderBook({ projectId: 'proj-1' }));
      const action = await resultPromise;

      expect(action).toEqual(MarketplaceActions.loadOrderBookFailure({ error: 'Failed' }));
    });
  });

  // ── Create Listing ──────────────────────────────────────────────────────────

  describe('createListing$', () => {
    it('emits createListingSuccess on success', async () => {
      marketplaceServiceMock.createListing.mockResolvedValue(mockListing);

      const resultPromise = firstValueFrom(effects.createListing$);
      actions$.next(
        MarketplaceActions.createListing({
          data: { projectId: 'proj-1', amount: '5000', price: 2.5 },
        }),
      );
      const action = await resultPromise;

      expect(action).toEqual(MarketplaceActions.createListingSuccess({ listing: mockListing }));
    });

    it('emits createListingFailure on error', async () => {
      marketplaceServiceMock.createListing.mockRejectedValue(new Error('Insufficient balance'));

      const resultPromise = firstValueFrom(effects.createListing$);
      actions$.next(
        MarketplaceActions.createListing({
          data: { projectId: 'proj-1', amount: '5000', price: 2.5 },
        }),
      );
      const action = await resultPromise;

      expect(action).toEqual(
        MarketplaceActions.createListingFailure({ error: 'Insufficient balance' }),
      );
    });
  });

  // ── exhaustMap deduplication ────────────────────────────────────────────────

  describe('createListing$ — exhaustMap deduplication', () => {
    it('ignores a second dispatch while the first is in flight', async () => {
      let resolveFirst!: (v: MarketplaceListing) => void;
      const firstCallPromise = new Promise<MarketplaceListing>((res) => {
        resolveFirst = res;
      });

      marketplaceServiceMock.createListing
        .mockReturnValueOnce(firstCallPromise)
        .mockResolvedValue(mockListing);

      const resultPromise = firstValueFrom(effects.createListing$);

      const listingData = { projectId: 'proj-1', amount: '5000', price: 2.5 };
      actions$.next(MarketplaceActions.createListing({ data: listingData }));
      actions$.next(MarketplaceActions.createListing({ data: listingData }));

      await new Promise((r) => setTimeout(r, 10));
      resolveFirst(mockListing);
      await resultPromise;

      expect(marketplaceServiceMock.createListing).toHaveBeenCalledTimes(1);
    });
  });

  // ── Success side-effects ────────────────────────────────────────────────────

  describe('createListingSuccess$', () => {
    it('shows a success notification', async () => {
      const resultPromise = firstValueFrom(effects.createListingSuccess$);
      actions$.next(MarketplaceActions.createListingSuccess({ listing: mockListing }));
      await resultPromise;

      expect(notificationServiceMock.success).toHaveBeenCalledWith(
        'Listing created',
        'Your listing is now live',
      );
    });
  });

  describe('createListingFailure$', () => {
    it('shows an error notification', async () => {
      const resultPromise = firstValueFrom(effects.createListingFailure$);
      actions$.next(MarketplaceActions.createListingFailure({ error: 'Insufficient balance' }));
      await resultPromise;

      expect(notificationServiceMock.error).toHaveBeenCalledWith(
        'Failed to create listing',
        'Insufficient balance',
      );
    });
  });
});
