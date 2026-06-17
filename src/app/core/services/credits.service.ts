import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { CreditBalance, CreditTransaction, CreditPortfolio } from '../models/credit.model';
import { PaginatedResponse } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class CreditsService {
  constructor(private api: ApiService) {}

  async getPortfolio(): Promise<CreditPortfolio> {
    return this.api.get<CreditPortfolio>('/credits/portfolio');
  }

  async getBalances(): Promise<CreditBalance[]> {
    return this.api.get<CreditBalance[]>('/credits/balances');
  }

  async getTransactions(projectId?: string): Promise<CreditTransaction[]> {
    const params: Record<string, any> = {};
    if (projectId) params['projectId'] = projectId;
    return this.api.get<CreditTransaction[]>('/credits/transactions', { params });
  }

  async getBalance(projectId: string): Promise<CreditBalance> {
    return this.api.get<CreditBalance>(`/credits/balances/${projectId}`);
  }
}
