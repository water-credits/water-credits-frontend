import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Proposal, GovernanceConfig } from '../models/proposal.model';
import { PaginatedResponse } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class GovernanceService {
  constructor(private api: ApiService) {}

  async getProposals(params?: { page?: number; limit?: number; status?: string }): Promise<PaginatedResponse<Proposal>> {
    return this.api.get<PaginatedResponse<Proposal>>('/governance/proposals', { params });
  }

  async getProposal(id: string): Promise<Proposal> {
    return this.api.get<Proposal>(`/governance/proposals/${id}`);
  }

  async createProposal(data: { title: string; description: string; actionType: string; actionParams: Record<string, any> }): Promise<Proposal> {
    return this.api.post<Proposal>('/governance/proposals', data);
  }

  async vote(proposalId: string, vote: 'for' | 'against'): Promise<void> {
    return this.api.post<void>(`/governance/proposals/${proposalId}/vote`, { vote });
  }

  async execute(proposalId: string): Promise<void> {
    return this.api.post<void>(`/governance/proposals/${proposalId}/execute`);
  }

  async getConfig(): Promise<GovernanceConfig> {
    return this.api.get<GovernanceConfig>('/governance/config');
  }

  async updateConfig(data: Partial<GovernanceConfig>): Promise<GovernanceConfig> {
    return this.api.patch<GovernanceConfig>('/governance/config', data);
  }
}
