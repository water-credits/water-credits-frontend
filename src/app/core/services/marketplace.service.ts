import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { PaginatedResponse } from '../models/pagination.model';

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
  constructor(private api: ApiService) {}

  async getListings(params?: { page?: number; limit?: number; status?: string; projectId?: string }): Promise<PaginatedResponse<MarketplaceListing>> {
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
}
