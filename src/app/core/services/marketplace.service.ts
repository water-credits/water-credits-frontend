import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { PaginatedResponse } from '../models/pagination.model';
import { WalletService } from './wallet.service';

/**
 * MarketplaceService: wraps backend marketplace endpoints and performs the
 * client-side signing flow for Stellar transactions. The backend prepares an
 * unsigned XDR for on-chain operations (manageSellOffer / manageBuyOffer / path
 * payments) and this service asks `WalletService` (Freighter) to sign the XDR
 * before returning it to the backend for submission.
 */

export interface MarketplaceListing {
  id: string;
  projectId: string;
  projectName: string;
  sellerId: string;
  sellerName?: string;
  amount: string;
  price: number;
  totalValue: number;
  status: 'active' | 'filled' | 'cancelled' | 'expired';
  expiresAt?: string;
  createdAt: string;
}

export interface OrderBookEntry {
  price: number;
  amount: string;
  total: string;
  count: number;
}

export interface OrderBook {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
}

export interface CreateListingRequest {
  projectId: string;
  amount: string;
  price: number;
  expiresAt?: string;
}

@Injectable({ providedIn: 'root' })
export class MarketplaceService {
  constructor(
    private api: ApiService,
    private wallet: WalletService,
  ) {}

  async getListings(params?: {
    page?: number;
    limit?: number;
    status?: string;
    projectId?: string;
  }): Promise<PaginatedResponse<MarketplaceListing>> {
    return this.api.get<PaginatedResponse<MarketplaceListing>>('/marketplace/listings', { params });
  }

  async getListing(id: string): Promise<MarketplaceListing> {
    return this.api.get<MarketplaceListing>(`/marketplace/listings/${id}`);
  }

  async createListing(data: CreateListingRequest): Promise<MarketplaceListing> {
    // Server-side prepares unsigned XDR for manageSellOffer and returns it plus
    // the network passphrase. Client signs via Freighter and returns signed XDR
    // to the server for submission.
    const prepare = await this.api.post<{ unsignedXdr: string; networkPassphrase: string }>(
      '/marketplace/listings/prepare',
      data,
    );

    const signed = await this.wallet.signTx(
      prepare.unsignedXdr,
      'stellar',
      prepare.networkPassphrase,
    );
    if (!signed) throw new Error('Transaction signing was cancelled');

    const result = await this.api.post<MarketplaceListing>('/marketplace/listings/submit', {
      signedXdr: signed,
    });
    return result;
  }

  async cancelListing(id: string): Promise<void> {
    return this.api.post<void>(`/marketplace/listings/${id}/cancel`);
  }

  async getOrderBook(projectId: string): Promise<OrderBook> {
    return this.api.get<OrderBook>(`/marketplace/orderbook/${projectId}`);
  }

  /**
   * Buy a listing by quantity. The server prepares an unsigned XDR for the
   * buy operation (manageBuyOffer / path payment). Client signs and the signed
   * XDR is returned to the server for submission.
   */
  async buyListing(listingId: string, quantity: string): Promise<void> {
    const prepare = await this.api.post<{ unsignedXdr: string; networkPassphrase: string }>(
      `/marketplace/listings/${listingId}/prepare-buy`,
      { quantity },
    );

    const signed = await this.wallet.signTx(
      prepare.unsignedXdr,
      'stellar',
      prepare.networkPassphrase,
    );
    if (!signed) throw new Error('Transaction signing was cancelled');

    await this.api.post(`/marketplace/listings/${listingId}/submit-buy`, { signedXdr: signed });
  }

  async getPriceHistory(projectId: string): Promise<any> {
    return this.api.get<any>(`/marketplace/prices`, { params: { projectId } });
  }

  async getMyOrders(): Promise<PaginatedResponse<MarketplaceListing>> {
    return this.api.get<PaginatedResponse<MarketplaceListing>>('/marketplace/orders/mine');
  }
}
