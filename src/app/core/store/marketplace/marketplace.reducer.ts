import { createReducer, on } from '@ngrx/store';
import * as MarketplaceActions from './marketplace.actions';
import { MarketplaceListing, OrderBook } from '../../services/marketplace.service';

export interface MarketplaceState {
  listings: MarketplaceListing[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  /** Active filter values applied to the current listings query. */
  filters: { status?: string; projectId?: string; search?: string };
  orderBook: OrderBook | null;
  /** True while listings or order book fetch is in flight. */
  loading: boolean;
  /** True while create-listing mutation is in flight. */
  creating: boolean;
  error: string | null;
}

const initialState: MarketplaceState = {
  listings: [],
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
  filters: {},
  orderBook: null,
  loading: false,
  creating: false,
  error: null,
};

export const marketplaceReducer = createReducer(
  initialState,

  // ── Load Listings ───────────────────────────────────────────────────────────
  on(MarketplaceActions.loadListings, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(MarketplaceActions.loadListingsSuccess, (state, { response }) => ({
    ...state,
    loading: false,
    listings: response.data,
    total: response.total,
    page: response.page,
    limit: response.limit,
    totalPages: response.totalPages,
  })),
  on(MarketplaceActions.loadListingsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // ── Load Order Book ─────────────────────────────────────────────────────────
  on(MarketplaceActions.loadOrderBook, (state) => ({
    ...state,
    loading: true,
    orderBook: null,
    error: null,
  })),
  on(MarketplaceActions.loadOrderBookSuccess, (state, { orderBook }) => ({
    ...state,
    loading: false,
    orderBook,
  })),
  on(MarketplaceActions.loadOrderBookFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // ── Create Listing ──────────────────────────────────────────────────────────
  on(MarketplaceActions.createListing, (state) => ({
    ...state,
    creating: true,
    error: null,
  })),
  on(MarketplaceActions.createListingSuccess, (state, { listing }) => ({
    ...state,
    creating: false,
    listings: [listing, ...state.listings],
    total: state.total + 1,
  })),
  on(MarketplaceActions.createListingFailure, (state, { error }) => ({
    ...state,
    creating: false,
    error,
  })),

  // ── Filters / Pagination ────────────────────────────────────────────────────
  on(MarketplaceActions.setListingsFilters, (state, { status, projectId, search }) => ({
    ...state,
    filters: { status, projectId, search },
    page: 1,
  })),
  on(MarketplaceActions.setListingsPage, (state, { page }) => ({
    ...state,
    page,
  })),
);
