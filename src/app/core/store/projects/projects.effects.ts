import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, from } from 'rxjs';
import { map, switchMap, catchError, tap } from 'rxjs/operators';
import * as ProjectsActions from './projects.actions';
import { ProjectsService } from '../../services/projects.service';
import { NotificationService } from '../../services/notification.service';

@Injectable()
export class ProjectsEffects {
  // Dependencies are declared as fields, above the effects that use them.
  // With `useDefineForClassFields` (tsconfig target ES2022) class field
  // initializers run *before* constructor parameter properties are assigned,
  // so effects referencing `this.actions$` would read `undefined` and throw
  // at construction time if these were injected via the constructor.
  private readonly actions$ = inject(Actions);
  private readonly projectsService = inject(ProjectsService);
  private readonly router = inject(Router);
  private readonly notificationService = inject(NotificationService);

  loadProjects$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProjectsActions.loadProjects),
      switchMap(({ filters }) =>
        from(this.projectsService.getProjects(filters)).pipe(
          map((response) => ProjectsActions.loadProjectsSuccess({ response })),
          catchError((error) =>
            of(
              ProjectsActions.loadProjectsFailure({
                error: error.message || 'Failed to load projects',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  loadProject$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProjectsActions.loadProject),
      switchMap(({ id }) =>
        from(this.projectsService.getProject(id)).pipe(
          map((project) => ProjectsActions.loadProjectSuccess({ project })),
          catchError((error) =>
            of(
              ProjectsActions.loadProjectFailure({
                error: error.message || 'Failed to load project',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  createProject$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProjectsActions.createProject),
      switchMap(({ data }) =>
        from(this.projectsService.createProject(data)).pipe(
          map((project) => ProjectsActions.createProjectSuccess({ project })),
          catchError((error) =>
            of(
              ProjectsActions.createProjectFailure({
                error: error.message || 'Failed to create project',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  /**
   * After a project is successfully created, notify the user and navigate to
   * its detail page. Both side effects live here (and only here) so they run
   * exactly once, regardless of which component dispatched the create.
   * Using a non-dispatching effect (dispatch: false) for the side-navigation.
   */
  createProjectSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ProjectsActions.createProjectSuccess),
        tap(({ project }) => {
          this.notificationService.success(
            'Project created',
            `${project.name} has been registered successfully`,
          );
          this.router.navigate(['/projects', project.id]);
        }),
      ),
    { dispatch: false },
  );

  updateProject$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ProjectsActions.updateProject),
      switchMap(({ id, data }) =>
        from(this.projectsService.updateProject(id, data)).pipe(
          map((project) => ProjectsActions.updateProjectSuccess({ project })),
          catchError((error) =>
            of(
              ProjectsActions.updateProjectFailure({
                error: error.message || 'Failed to update project',
              }),
            ),
          ),
        ),
      ),
    ),
  );
}
