import { TestBed } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { Subject, firstValueFrom } from 'rxjs';
import { Action } from '@ngrx/store';

import { FarmersEffects } from './farmers.effects';
import { ProjectsService } from '../../services/projects.service';
import { AnalyticsService } from '../../services/analytics.service';
import { NotificationService } from '../../services/notification.service';
import * as FarmersActions from './farmers.actions';
import { Project, ProjectStatus } from '../../models/project.model';
import { AnalyticsOverview } from '../../models/analytics.model';

// ─── Test fixtures ────────────────────────────────────────────────────────────

const mockProject: Project = {
  id: 'proj-001',
  name: 'North Field',
  description: 'Cover crop project',
  latitude: 41.4,
  longitude: -90.2,
  methodology: 'water-quality-credits-v1',
  areaHectares: 50,
  baselineStart: '2025-01-01T00:00:00Z',
  baselineEnd: '2025-12-31T00:00:00Z',
  status: ProjectStatus.ACTIVE,
  ownerId: 'user-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockOverview: AnalyticsOverview = {
  totalProjects: 5,
  activeProjects: 3,
  totalCreditsMinted: '50000',
  totalCreditsRetired: '12000',
  totalRetirements: 4,
  totalUsers: 10,
  verifiedOracles: 2,
};

const mockParcelCreate = {
  name: 'North Field',
  description: 'Cover crop project',
  latitude: 41.4,
  longitude: -90.2,
  methodology: 'water-quality-credits-v1',
  areaHectares: 50,
  baselineStart: '2025-01-01',
  baselineEnd: '2025-12-31',
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('FarmersEffects', () => {
  let effects: FarmersEffects;
  let actions$: Subject<Action>;

  const projectsServiceMock = {
    getProjects: vi.fn(),
    createProject: vi.fn(),
  };

  const analyticsServiceMock = {
    getOverview: vi.fn(),
  };

  const notificationServiceMock = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  };

  beforeEach(() => {
    actions$ = new Subject<Action>();
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        FarmersEffects,
        provideStore({}),
        provideMockActions(() => actions$),
        { provide: ProjectsService, useValue: projectsServiceMock },
        { provide: AnalyticsService, useValue: analyticsServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
      ],
    });

    effects = TestBed.inject(FarmersEffects);
  });

  // ── Load Parcels ────────────────────────────────────────────────────────────

  describe('loadParcels$', () => {
    it('emits loadParcelsSuccess with parcel list on success', async () => {
      projectsServiceMock.getProjects.mockResolvedValue({
        data: [mockProject],
        total: 1,
        page: 1,
        limit: 100,
        totalPages: 1,
      });

      const resultPromise = firstValueFrom(effects.loadParcels$);
      actions$.next(FarmersActions.loadParcels());
      const action = await resultPromise;

      expect(action).toEqual(FarmersActions.loadParcelsSuccess({ parcels: [mockProject] }));
      expect(projectsServiceMock.getProjects).toHaveBeenCalledWith({ limit: 100 });
    });

    it('emits loadParcelsFailure on error', async () => {
      projectsServiceMock.getProjects.mockRejectedValue(new Error('Network error'));

      const resultPromise = firstValueFrom(effects.loadParcels$);
      actions$.next(FarmersActions.loadParcels());
      const action = await resultPromise;

      expect(action).toEqual(FarmersActions.loadParcelsFailure({ error: 'Network error' }));
    });

    it('returns empty array when response.data is undefined', async () => {
      projectsServiceMock.getProjects.mockResolvedValue({
        data: undefined,
        total: 0,
        page: 1,
        limit: 100,
        totalPages: 0,
      });

      const resultPromise = firstValueFrom(effects.loadParcels$);
      actions$.next(FarmersActions.loadParcels());
      const action = await resultPromise;

      expect(action).toEqual(FarmersActions.loadParcelsSuccess({ parcels: [] }));
    });
  });

  // ── Register Parcel ─────────────────────────────────────────────────────────

  describe('registerParcel$', () => {
    it('emits registerParcelSuccess on success', async () => {
      projectsServiceMock.createProject.mockResolvedValue(mockProject);

      const resultPromise = firstValueFrom(effects.registerParcel$);
      actions$.next(FarmersActions.registerParcel({ data: mockParcelCreate }));
      const action = await resultPromise;

      expect(action).toEqual(FarmersActions.registerParcelSuccess({ parcel: mockProject }));
      expect(projectsServiceMock.createProject).toHaveBeenCalledWith(mockParcelCreate);
    });

    it('emits registerParcelFailure on error', async () => {
      projectsServiceMock.createProject.mockRejectedValue(new Error('Validation failed'));

      const resultPromise = firstValueFrom(effects.registerParcel$);
      actions$.next(FarmersActions.registerParcel({ data: mockParcelCreate }));
      const action = await resultPromise;

      expect(action).toEqual(FarmersActions.registerParcelFailure({ error: 'Validation failed' }));
    });
  });

  // ── exhaustMap deduplication ────────────────────────────────────────────────

  describe('registerParcel$ — exhaustMap deduplication', () => {
    it('processes only the first dispatch while in flight', async () => {
      let resolveFirst!: (v: Project) => void;
      const firstCallPromise = new Promise<Project>((res) => {
        resolveFirst = res;
      });

      projectsServiceMock.createProject
        .mockReturnValueOnce(firstCallPromise)
        .mockResolvedValue(mockProject);

      const resultPromise = firstValueFrom(effects.registerParcel$);

      actions$.next(FarmersActions.registerParcel({ data: mockParcelCreate }));
      actions$.next(FarmersActions.registerParcel({ data: mockParcelCreate }));

      await new Promise((r) => setTimeout(r, 10));
      resolveFirst(mockProject);
      await resultPromise;

      expect(projectsServiceMock.createProject).toHaveBeenCalledTimes(1);
    });
  });

  // ── Success side-effects ────────────────────────────────────────────────────

  describe('registerParcelSuccess$', () => {
    it('shows a success notification with the parcel name', async () => {
      const resultPromise = firstValueFrom(effects.registerParcelSuccess$);
      actions$.next(FarmersActions.registerParcelSuccess({ parcel: mockProject }));
      await resultPromise;

      expect(notificationServiceMock.success).toHaveBeenCalledWith(
        'Parcel registered',
        expect.stringContaining('North Field'),
      );
    });
  });

  describe('registerParcelFailure$', () => {
    it('shows an error notification', async () => {
      const resultPromise = firstValueFrom(effects.registerParcelFailure$);
      actions$.next(FarmersActions.registerParcelFailure({ error: 'Validation failed' }));
      await resultPromise;

      expect(notificationServiceMock.error).toHaveBeenCalledWith(
        'Failed to register parcel',
        'Validation failed',
      );
    });
  });

  // ── Load Farmer Overview ────────────────────────────────────────────────────

  describe('loadFarmerOverview$', () => {
    it('emits loadFarmerOverviewSuccess on success', async () => {
      analyticsServiceMock.getOverview.mockResolvedValue(mockOverview);

      const resultPromise = firstValueFrom(effects.loadFarmerOverview$);
      actions$.next(FarmersActions.loadFarmerOverview());
      const action = await resultPromise;

      expect(action).toEqual(FarmersActions.loadFarmerOverviewSuccess({ overview: mockOverview }));
    });

    it('emits loadFarmerOverviewFailure on error', async () => {
      analyticsServiceMock.getOverview.mockRejectedValue(new Error('Service unavailable'));

      const resultPromise = firstValueFrom(effects.loadFarmerOverview$);
      actions$.next(FarmersActions.loadFarmerOverview());
      const action = await resultPromise;

      expect(action).toEqual(
        FarmersActions.loadFarmerOverviewFailure({ error: 'Service unavailable' }),
      );
    });
  });
});
