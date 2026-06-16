export enum ProjectStatus {
  DRAFT = 'draft',
  REGISTERED = 'registered',
  BASELINE = 'baseline',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CLOSED = 'closed',
}

export interface Project {
  id: string;
  ownerId: string;
  ownerName?: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  methodology: string;
  status: ProjectStatus;
  areaHectares: number;
  creditTokenAddress?: string;
  contractId?: string;
  baselineStart: string;
  baselineEnd: string;
  creditPrice?: number;
  totalCreditsMinted?: number;
  totalCreditsRetired?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectCreate {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  methodology: string;
  areaHectares: number;
  baselineStart: string;
  baselineEnd: string;
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
  methodology?: string;
  status?: ProjectStatus;
  creditPrice?: number;
}

export interface ProjectFilters {
  status?: ProjectStatus;
  methodology?: string;
  ownerId?: string;
  search?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  documentType: string;
  filename: string;
  ipfsUri: string;
  createdAt: string;
}
