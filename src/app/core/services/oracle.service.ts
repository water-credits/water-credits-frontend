import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { OracleSubmission, OracleConfig } from '../models/oracle.model';
import { PaginatedResponse } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class OracleService {
  constructor(private api: ApiService) {}

  async getSubmissions(params?: {
    page?: number;
    limit?: number;
    projectId?: string;
  }): Promise<PaginatedResponse<OracleSubmission>> {
    return this.api.get<PaginatedResponse<OracleSubmission>>('/oracle/submissions', { params });
  }

  async getConfig(): Promise<OracleConfig> {
    return this.api.get<OracleConfig>('/oracle/config');
  }

  async triggerSubmission(): Promise<void> {
    return this.api.post<void>('/oracle/trigger');
  }
}
