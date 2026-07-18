import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { PaginatedResponse } from '../models/pagination.model';
import {
  Project,
  ProjectCreate,
  ProjectUpdate,
  ProjectFilters,
  ProjectDocument,
} from '../models/project.model';

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  constructor(private api: ApiService) {}

  async getProjects(filters?: ProjectFilters): Promise<PaginatedResponse<Project>> {
    const params: Record<string, string | number | boolean> = {};
    if (filters) {
      if (filters.page) params['page'] = filters.page;
      if (filters.limit) params['limit'] = filters.limit;
      if (filters.status) params['status'] = filters.status;
      if (filters.methodology) params['methodology'] = filters.methodology;
      if (filters.ownerId) params['ownerId'] = filters.ownerId;
      if (filters.search) params['search'] = filters.search;
      if (filters.lat !== undefined) params['lat'] = filters.lat;
      if (filters.lng !== undefined) params['lng'] = filters.lng;
      if (filters.radius !== undefined) params['radius'] = filters.radius;
      if (filters.sortBy) params['sortBy'] = filters.sortBy;
      if (filters.sortOrder) params['sortOrder'] = filters.sortOrder;
    }
    return this.api.get<PaginatedResponse<Project>>('/projects', { params });
  }

  async getProject(id: string): Promise<Project> {
    return this.api.get<Project>(`/projects/${id}`);
  }

  async createProject(data: ProjectCreate): Promise<Project> {
    return this.api.post<Project>('/projects', data);
  }

  async updateProject(id: string, data: ProjectUpdate): Promise<Project> {
    return this.api.patch<Project>(`/projects/${id}`, data);
  }

  async deleteProject(id: string): Promise<void> {
    return this.api.delete<void>(`/projects/${id}`);
  }

  async getProjectDocuments(projectId: string): Promise<ProjectDocument[]> {
    return this.api.get<ProjectDocument[]>(`/projects/${projectId}/documents`);
  }
}
