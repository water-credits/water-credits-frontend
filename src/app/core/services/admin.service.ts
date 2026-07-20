import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { User, UserRole } from '../models/user.model';
import { OracleSubmission } from '../models/oracle.model';
import { GovernanceConfig } from '../models/proposal.model';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AdminHealthResponse {
  totalUsers: number;
  activeOracles: number;
  totalOracles: number;
  pendingQueueDepth: number;
  apiLatencyMs: number;
}

export interface AdminSystemEvent {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

/**
 * AdminService — thin HTTP wrapper for all `/admin/*` endpoints.
 *
 * All methods return plain Promises so NgRx effects can drive them
 * with `from(promise)` without introducing RxJS-land side effects into
 * the service layer itself.
 */
@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private api: ApiService) {}

  // ── System Health ───────────────────────────────────────────────────────────

  getHealth(): Promise<AdminHealthResponse> {
    return this.api.get<AdminHealthResponse>('/admin/health');
  }

  getRecentEvents(limit = 5): Promise<AdminSystemEvent[]> {
    return this.api.get<AdminSystemEvent[]>('/admin/events', { params: { limit } });
  }

  // ── Users ───────────────────────────────────────────────────────────────────

  getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<User>> {
    return this.api.get<PaginatedResponse<User>>('/admin/users', { params });
  }

  updateUserRole(userId: string, role: UserRole): Promise<User> {
    return this.api.patch<User>(`/admin/users/${userId}/role`, { role });
  }

  updateUserKyc(userId: string, isKycVerified: boolean): Promise<User> {
    return this.api.patch<User>(`/admin/users/${userId}/kyc`, { isKycVerified });
  }

  deleteUser(userId: string): Promise<void> {
    return this.api.delete<void>(`/admin/users/${userId}`);
  }

  // ── Oracles ─────────────────────────────────────────────────────────────────

  getOracles(params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<OracleSubmission>> {
    return this.api.get<PaginatedResponse<OracleSubmission>>('/admin/oracles', { params });
  }

  /**
   * Register a new oracle node on the protocol.
   * The backend signs the Soroban `add_oracle` call and returns the
   * unsigned XDR for the admin wallet to countersign via WalletService.
   */
  addOracle(address: string): Promise<{ unsignedXdr?: string; networkPassphrase?: string }> {
    return this.api.post<{ unsignedXdr?: string; networkPassphrase?: string }>(
      '/admin/oracles',
      { address },
    );
  }

  /**
   * Submit the admin-signed XDR to finalise the oracle registration.
   * Called only when `addOracle()` returned an `unsignedXdr` (two-phase path).
   */
  submitOracleAdd(address: string, signedXdr: string): Promise<void> {
    return this.api.post<void>('/admin/oracles/submit-add', { address, signedXdr });
  }

  removeOracle(address: string): Promise<void> {
    return this.api.delete<void>(`/admin/oracles/${encodeURIComponent(address)}`);
  }

  // ── Config / Fees ───────────────────────────────────────────────────────────

  getConfig(): Promise<GovernanceConfig> {
    return this.api.get<GovernanceConfig>('/admin/config');
  }

  updateConfig(changes: Partial<GovernanceConfig>): Promise<GovernanceConfig> {
    return this.api.put<GovernanceConfig>('/admin/config', changes);
  }
}
