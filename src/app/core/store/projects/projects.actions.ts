import { createAction, props } from '@ngrx/store';
import { Project, ProjectCreate, ProjectUpdate, ProjectFilters } from '../../models/project.model';
import { PaginatedResponse } from '../../models/pagination.model';

export const loadProjects = createAction(
  '[Projects] Load Projects',
  props<{ filters?: ProjectFilters }>(),
);
export const loadProjectsSuccess = createAction(
  '[Projects] Load Projects Success',
  props<{ response: PaginatedResponse<Project> }>(),
);
export const loadProjectsFailure = createAction(
  '[Projects] Load Projects Failure',
  props<{ error: string }>(),
);

export const loadProject = createAction('[Projects] Load Project', props<{ id: string }>());
export const loadProjectSuccess = createAction(
  '[Projects] Load Project Success',
  props<{ project: Project }>(),
);
export const loadProjectFailure = createAction(
  '[Projects] Load Project Failure',
  props<{ error: string }>(),
);

export const createProject = createAction(
  '[Projects] Create Project',
  props<{ data: ProjectCreate }>(),
);
export const createProjectSuccess = createAction(
  '[Projects] Create Project Success',
  props<{ project: Project }>(),
);
export const createProjectFailure = createAction(
  '[Projects] Create Project Failure',
  props<{ error: string }>(),
);

export const updateProject = createAction(
  '[Projects] Update Project',
  props<{ id: string; data: ProjectUpdate }>(),
);
export const updateProjectSuccess = createAction(
  '[Projects] Update Project Success',
  props<{ project: Project }>(),
);
export const updateProjectFailure = createAction(
  '[Projects] Update Project Failure',
  props<{ error: string }>(),
);

export const setProjectFilters = createAction(
  '[Projects] Set Filters',
  props<{ filters: ProjectFilters }>(),
);
export const clearProjectFilters = createAction('[Projects] Clear Filters');
export const setProjectPage = createAction('[Projects] Set Page', props<{ page: number }>());
