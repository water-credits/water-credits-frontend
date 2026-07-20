import { createFeatureSelector, createSelector } from '@ngrx/store';
import { MarketplaceState } from './marketplace.reducer';

export const selectMarketplaceState = createFeatureSelector<MarketplaceState>('marketplace');

export const selectListings = createSelector(selectMarketplaceState, (state) => state.listings);

export const selectMarketplaceLoading = createSelector(
  selectMarketplaceState,
  (state) => state.loading,
);

export const selectMarketplaceCreating = createSelector(
  selectMarketplaceState,
  (state) => state.creating,
);

export const selectMarketplaceError = createSelector(
  selectMarketplaceState,
  (state) => state.error,
);

export const selectMarketplacePagination = createSelector(selectMarketplaceState, (state) => ({
  page: state.page,
  limit: state.limit,
  total: state.total,
  totalPages: state.totalPages,
}));

export const selectMarketplaceFilters = createSelector(
  selectMarketplaceState,
  (state) => state.filters,
);

export const selectOrderBook = createSelector(selectMarketplaceState, (state) => state.orderBook);
