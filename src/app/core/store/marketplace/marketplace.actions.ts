import { createAction, props } from '@ngrx/store';
import { MarketplaceListing, OrderBook } from '../../services/marketplace.service';
import { PaginatedResponse } from '../../models/pagination.model';

// ─── Load Listings ────────────────────────────────────────────────────────────

export const loadListings = createAction(
  '[Marketplace] Load Listings',
  props<{
    params?: {
      page?: number;
      limit?: number;
      status?: string;
      projectId?: string;
      search?: string;
    };
  }>(),
);

export const loadListingsSuccess = createAction(
  '[Marketplace] Load Listings Success',
  props<{ response: PaginatedResponse<MarketplaceListing> }>(),
);

export const loadListingsFailure = createAction(
  '[Marketplace] Load Listings Failure',
  props<{ error: string }>(),
);

// ─── Load Order Book ──────────────────────────────────────────────────────────

export const loadOrderBook = createAction(
  '[Marketplace] Load Order Book',
  props<{ projectId: string }>(),
);

export const loadOrderBookSuccess = createAction(
  '[Marketplace] Load Order Book Success',
  props<{ orderBook: OrderBook }>(),
);

export const loadOrderBookFailure = createAction(
  '[Marketplace] Load Order Book Failure',
  props<{ error: string }>(),
);

// ─── Create Listing ───────────────────────────────────────────────────────────

export const createListing = createAction(
  '[Marketplace] Create Listing',
  props<{ data: { projectId: string; amount: string; price: number; expiresAt?: string } }>(),
);

export const createListingSuccess = createAction(
  '[Marketplace] Create Listing Success',
  props<{ listing: MarketplaceListing }>(),
);

export const createListingFailure = createAction(
  '[Marketplace] Create Listing Failure',
  props<{ error: string }>(),
);

// ─── Purchase Listing ───────────────────────────────────────────────────────

export const purchaseListing = createAction(
  '[Marketplace] Purchase Listing',
  props<{ listingId: string; quantity: string }>(),
);

export const purchaseListingSuccess = createAction('[Marketplace] Purchase Listing Success');

export const purchaseListingFailure = createAction(
  '[Marketplace] Purchase Listing Failure',
  props<{ error: string }>(),
);

// ─── My Orders / Price History ───────────────────────────────────────────────

export const loadMyOrders = createAction('[Marketplace] Load My Orders');

export const loadMyOrdersSuccess = createAction(
  '[Marketplace] Load My Orders Success',
  props<{ response: PaginatedResponse<MarketplaceListing> }>(),
);

export const loadMyOrdersFailure = createAction(
  '[Marketplace] Load My Orders Failure',
  props<{ error: string }>(),
);

export const loadPriceHistory = createAction(
  '[Marketplace] Load Price History',
  props<{ projectId: string }>(),
);

export const loadPriceHistorySuccess = createAction(
  '[Marketplace] Load Price History Success',
  props<{ data: any }>(),
);

export const loadPriceHistoryFailure = createAction(
  '[Marketplace] Load Price History Failure',
  props<{ error: string }>(),
);

// ─── Set Filters ──────────────────────────────────────────────────────────────

export const setListingsFilters = createAction(
  '[Marketplace] Set Filters',
  props<{ status?: string; projectId?: string; search?: string }>(),
);

export const setListingsPage = createAction('[Marketplace] Set Page', props<{ page: number }>());
