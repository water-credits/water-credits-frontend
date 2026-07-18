import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ProjectsState } from './projects.reducer';

export const selectProjectsState = createFeatureSelector<ProjectsState>('projects');

export const selectAllProjects = createSelector(selectProjectsState, (state) => state.projects);
export const selectSelectedProject = createSelector(
  selectProjectsState,
  (state) => state.selectedProject,
);
export const selectProjectsLoading = createSelector(selectProjectsState, (state) => state.loading);
export const selectProjectsError = createSelector(selectProjectsState, (state) => state.error);
export const selectProjectsPagination = createSelector(selectProjectsState, (state) => ({
  page: state.page,
  limit: state.limit,
  total: state.total,
  totalPages: state.totalPages,
}));
export const selectProjectsFilters = createSelector(selectProjectsState, (state) => state.filters);
