import { TemplateRef } from '@angular/core';

export type SortDirection = 'asc' | 'desc';

export interface ColumnDef<T extends object = Record<string, unknown>> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  cellTemplate?: TemplateRef<{ $implicit: T; column: ColumnDef<T> }>;
}

export interface SortEvent {
  column: string;
  direction: SortDirection;
}

export interface Pagination {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
}

export type TrackByFunction<T> = (index: number, item: T) => unknown;
