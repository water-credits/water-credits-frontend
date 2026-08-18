import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideStore, Action } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { Subject, firstValueFrom, Subscription } from 'rxjs';
import { vi, describe, beforeEach, afterEach, it, expect } from 'vitest';

import { ProjectsEffects } from './projects.effects';
import { ProjectsService } from '../../services/projects.service';
import { NotificationService } from '../../services/notification.service';
import * as ProjectsActions from './projects.actions';
import { Project, ProjectStatus, ProjectCreate } from '../../models/project.model';

// ─── Test fixtures ────────────────────────────────────────────────────────────

const mockProject: Project = {
  id: 'proj-001',
  ownerId: 'user-1',
  name: 'Clear Water Valley',
  description: 'Restoration of the valley wetlands.',
  latitude: 41.4,
  longitude: -90.2,
  methodology: 'water-quality-credits-v1',
  status: ProjectStatus.DRAFT,
  areaHectares: 50,
  baselineStart: '2025-01-01T00:00:00Z',
  baselineEnd: '2025-06-01T00:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const mockProjectCreate: ProjectCreate = {
  name: 'Clear Water Valley',
  description: 'Restoration of the valley wetlands.',
  latitude: 41.4,
  longitude: -90.2,
  methodology: 'water-quality-credits-v1',
  areaHectares: 50,
  baselineStart: '2025-01-01',
  baselineEnd: '2025-06-01',
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ProjectsEffects', () => {
  let effects: ProjectsEffects;
  let actions$: Subject<Action>;
  let subscriptions: Subscription[];

  const projectsServiceMock = {
    getProjects: vi.fn(),
    getProject: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
  };

  const notificationServiceMock = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  };

  const routerMock = {
    navigate: vi.fn(),
  };

  beforeEach(() => {
    actions$ = new Subject<Action>();
    subscriptions = [];
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        ProjectsEffects,
        provideStore({}),
        provideMockActions(() => actions$),
        { provide: ProjectsService, useValue: projectsServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    effects = TestBed.inject(ProjectsEffects);
  });

  afterEach(() => {
    subscriptions.forEach((s) => s.unsubscribe());
  });

  /**
   * `createProjectSuccess$` is a `dispatch: false` effect, so nothing subscribes
   * to it for us. Subscribe exactly once — the way the NgRx runtime does — so
   * the "exactly once" assertions below measure real behaviour.
   */
  function runSuccessEffect(): void {
    subscriptions.push(effects.createProjectSuccess$.subscribe());
  }

  // ── createProject$ ──────────────────────────────────────────────────────────

  describe('createProject$', () => {
    it('emits createProjectSuccess with the created project', async () => {
      projectsServiceMock.createProject.mockResolvedValue(mockProject);

      const resultPromise = firstValueFrom(effects.createProject$);
      actions$.next(ProjectsActions.createProject({ data: mockProjectCreate }));
      const action = await resultPromise;

      expect(action).toEqual(ProjectsActions.createProjectSuccess({ project: mockProject }));
      expect(projectsServiceMock.createProject).toHaveBeenCalledWith(mockProjectCreate);
    });

    it('emits createProjectFailure with the error message', async () => {
      projectsServiceMock.createProject.mockRejectedValue(new Error('Name already taken'));

      const resultPromise = firstValueFrom(effects.createProject$);
      actions$.next(ProjectsActions.createProject({ data: mockProjectCreate }));
      const action = await resultPromise;

      expect(action).toEqual(ProjectsActions.createProjectFailure({ error: 'Name already taken' }));
    });

    it('falls back to a generic message when the error carries none', async () => {
      projectsServiceMock.createProject.mockRejectedValue({});

      const resultPromise = firstValueFrom(effects.createProject$);
      actions$.next(ProjectsActions.createProject({ data: mockProjectCreate }));
      const action = await resultPromise;

      expect(action).toEqual(
        ProjectsActions.createProjectFailure({ error: 'Failed to create project' }),
      );
    });
  });

  // ── createProjectSuccess$ — AC #2 and AC #3 ─────────────────────────────────

  describe('createProjectSuccess$', () => {
    it('raises the success notification exactly once', () => {
      runSuccessEffect();

      actions$.next(ProjectsActions.createProjectSuccess({ project: mockProject }));

      expect(notificationServiceMock.success).toHaveBeenCalledTimes(1);
      expect(notificationServiceMock.success).toHaveBeenCalledWith(
        'Project created',
        'Clear Water Valley has been registered successfully',
      );
    });

    it('navigates to the new project detail page exactly once', () => {
      runSuccessEffect();

      actions$.next(ProjectsActions.createProjectSuccess({ project: mockProject }));

      expect(routerMock.navigate).toHaveBeenCalledTimes(1);
      expect(routerMock.navigate).toHaveBeenCalledWith(['/projects', 'proj-001']);
    });

    it('stays 1:1 with the action — two creates produce two toasts and two navigations', () => {
      runSuccessEffect();

      actions$.next(ProjectsActions.createProjectSuccess({ project: mockProject }));
      actions$.next(
        ProjectsActions.createProjectSuccess({ project: { ...mockProject, id: 'proj-002' } }),
      );

      expect(notificationServiceMock.success).toHaveBeenCalledTimes(2);
      expect(routerMock.navigate).toHaveBeenCalledTimes(2);
      expect(routerMock.navigate).toHaveBeenLastCalledWith(['/projects', 'proj-002']);
    });

    it('notifies before navigating, so the toast survives the route change', () => {
      const order: string[] = [];
      notificationServiceMock.success.mockImplementation(() => order.push('notify'));
      routerMock.navigate.mockImplementation(() => order.push('navigate'));
      runSuccessEffect();

      actions$.next(ProjectsActions.createProjectSuccess({ project: mockProject }));

      expect(order).toEqual(['notify', 'navigate']);
    });

    it('does nothing on createProjectFailure', () => {
      runSuccessEffect();

      actions$.next(ProjectsActions.createProjectFailure({ error: 'Name already taken' }));

      expect(notificationServiceMock.success).not.toHaveBeenCalled();
      expect(routerMock.navigate).not.toHaveBeenCalled();
    });

    it('re-emits the action untouched (dispatch: false effect)', async () => {
      const action = ProjectsActions.createProjectSuccess({ project: mockProject });

      const resultPromise = firstValueFrom(effects.createProjectSuccess$);
      actions$.next(action);

      expect(await resultPromise).toEqual(action);
    });
  });
});
