import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { User } from '../models/user.model';
import { PaginatedResponse } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private api: ApiService) {}

  async getUsers(params?: { page?: number; limit?: number; role?: string }): Promise<PaginatedResponse<User>> {
    return this.api.get<PaginatedResponse<User>>('/users', { params });
  }

  async getUser(id: string): Promise<User> {
    return this.api.get<User>(`/users/${id}`);
  }

  async updateUserRole(id: string, role: string): Promise<User> {
    return this.api.patch<User>(`/users/${id}/role`, { role });
  }

  async updateUserKyc(id: string, isKycVerified: boolean): Promise<User> {
    return this.api.patch<User>(`/users/${id}/kyc`, { isKycVerified });
  }

  async deleteUser(id: string): Promise<void> {
    return this.api.delete<void>(`/users/${id}`);
  }
}
