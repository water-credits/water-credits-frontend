import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { PaginatedResponse } from '../models/pagination.model';
import {
  MarketplaceListing,
  CreateListingRequest,
  OrderBook,
  PriceHistoryResponse,
  PriceChartTimeRange,
} from '../models/marketplace.model';

// Re-export for backward-compat with existing store files that import from here.
export type { MarketplaceListing, CreateListingRequest, OrderBook } from '../models/marketplace.model';
export type { OrderBookEntry } from '../models/marketplace.model';

/**
 * Response from POST /marketplace/listings/:id/buy.
 *
 * Mirrors RetirementPrepareResponse: if the backend supports the two-step
 * flow it returns an unsigned XDR for the client to sign. When absent the
 * backend has already settled the purchase (legacy single-POST path).
 */
export interface BuyPrepareResponse {
  listing: MarketplaceListing;
  /** Base64-encoded unsigned XDR of the Soroban contract invocation. */
  unsignedXdr?: string;
  /** Stellar network passphrase needed by Freighter for correct signing. */
  networkPassphrase?: string;
}

/** Payload sent to POST /marketplace/listings/:id/submit after Freighter signs the XDR. */
export interface BuySubmitRequest {
  listingId: string;
  signedXdr: string;
}

@Injectable({ providedIn: 'root' })
export class MarketplaceService {
  constructor(private api: ApiService) {}

  async getListings(params?: {
    page?: number;
    limit?: number;
    status?: string;
    projectId?: string;
    search?: string;
  }): Promise<PaginatedResponse<MarketplaceListing>> {
    return this.api.get<PaginatedResponse<MarketplaceListing>>('/marketplace/listings', { params });
  }

  async getListing(id: string): Promise<MarketplaceListing> {
    return this.api.get<MarketplaceListing>(`/marketplace/listings/${id}`);
  }

  async createListing(data: CreateListingRequest): Promise<MarketplaceListing> {
    return this.api.post<MarketplaceListing>('/marketplace/listings', data);
  }

  async cancelListing(id: string): Promise<void> {
    return this.api.post<void>(`/marketplace/listings/${id}/cancel`);
  }

  async getOrderBook(projectId: string): Promise<OrderBook> {
    return this.api.get<OrderBook>(`/marketplace/orderbook/${projectId}`);
  }

  async buyListing(id: string): Promise<BuyPrepareResponse> {
    return this.api.post<BuyPrepareResponse>(`/marketplace/listings/${id}/buy`);
  }

  async submitPurchase(payload: BuySubmitRequest): Promise<MarketplaceListing> {
    return this.api.post<MarketplaceListing>(`/marketplace/listings/${payload.listingId}/submit`, {
      signedXdr: payload.signedXdr,
    });
  }
}
