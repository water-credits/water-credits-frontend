import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Retirement, RetirementRequest, RetirementCertificate } from '../models/retirement.model';
import { PaginatedResponse } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class RetirementService {
  constructor(private api: ApiService) {}

  async getRetirements(params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Retirement>> {
    return this.api.get<PaginatedResponse<Retirement>>('/retirements', { params });
  }

  async getRetirement(id: string): Promise<Retirement> {
    return this.api.get<Retirement>(`/retirements/${id}`);
  }

  async createRetirement(data: RetirementRequest): Promise<Retirement> {
    return this.api.post<Retirement>('/retirements', data);
  }

  async getCertificate(id: string): Promise<RetirementCertificate> {
    return this.api.get<RetirementCertificate>(`/retirements/${id}/certificate`);
  }
}
