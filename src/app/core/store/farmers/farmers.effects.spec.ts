import { TestBed } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { Subject, firstValueFrom } from 'rxjs';
import { Action } from '@ngrx/store';

import { FarmersEffects } from './farmers.effects';
import { ProjectsService } from '../../services/projects.service';
import { AnalyticsService } from '../../services/analytics.service';
import { FarmersService } from '../../services/farmers.service';
import { NotificationService } from '../../services/notification.service';
import * as FarmersActions from './farmers.actions';
import { Project, ProjectStatus } from '../../models/project.model';
import { AnalyticsOverview } from '../../models/analytics.model';
import { Bmp } from '../../models/bmp.model';

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

const mockBmp: Bmp = {
  id: 'cover-crops',
  name: 'Cover Crops',
  description: 'Plant cover crops to reduce erosion.',
  category: 'soil management',
  enrolled: false,
  estimatedCredits: 120,
  icon: null,
  requirements: ['Minimum 2 months coverage'],
};

const mockBmpEnrolled: Bmp = { ...mockBmp, enrolled: true };

const mockBmps: Bmp[] = [
  mockBmp,
  {
    id: 'no-till',
    name: 'No-Till Farming',
    description: 'Eliminate tillage.',
    category: 'soil management',
    enrolled: true,
    estimatedCredits: 85,
    icon: null,
    requirements: ['Zero tillage on enrolled acres'],
  },
];

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

  const farmersServiceMock = {
    getBmps: vi.fn(),
    enrollBmp: vi.fn(),
    unenrollBmp: vi.fn(),
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
        { provide: FarmersService, useValue: farmersServiceMock },
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

  // ── Load BMPs ───────────────────────────────────────────────────────────────

  describe('loadBmps$', () => {
    it('emits loadBmpsSuccess with the BMP list on success', async () => {
      farmersServiceMock.getBmps.mockResolvedValue(mockBmps);

      const resultPromise = firstValueFrom(effects.loadBmps$);
      actions$.next(FarmersActions.loadBmps());
      const action = await resultPromise;

      expect(action).toEqual(FarmersActions.loadBmpsSuccess({ bmps: mockBmps }));
      expect(farmersServiceMock.getBmps).toHaveBeenCalled();
    });

    it('emits loadBmpsSuccess with empty array when service returns [] (404 fallback)', async () => {
      farmersServiceMock.getBmps.mockResolvedValue([]);

      const resultPromise = firstValueFrom(effects.loadBmps$);
      actions$.next(FarmersActions.loadBmps());
      const action = await resultPromise;

      expect(action).toEqual(FarmersActions.loadBmpsSuccess({ bmps: [] }));
    });

    it('emits loadBmpsFailure on non-404 error', async () => {
      farmersServiceMock.getBmps.mockRejectedValue(new Error('Server error'));

      const resultPromise = firstValueFrom(effects.loadBmps$);
      actions$.next(FarmersActions.loadBmps());
      const action = await resultPromise;

      expect(action).toEqual(FarmersActions.loadBmpsFailure({ error: 'Server error' }));
    });
  });

  // ── Enroll Practice ─────────────────────────────────────────────────────────

  describe('enrollPractice$', () => {
    it('emits enrollPracticeSuccess with updated BMP on success', async () => {
      farmersServiceMock.enrollBmp.mockResolvedValue(mockBmpEnrolled);

      const resultPromise = firstValueFrom(effects.enrollPractice$);
      actions$.next(FarmersActions.enrollPractice({ practiceId: 'cover-crops' }));
      const action = await resultPromise;

      expect(action).toEqual(FarmersActions.enrollPracticeSuccess({ bmp: mockBmpEnrolled }));
      expect(farmersServiceMock.enrollBmp).toHaveBeenCalledWith('cover-crops');
    });

    it('emits enrollPracticeFailure on error', async () => {
      farmersServiceMock.enrollBmp.mockRejectedValue(new Error('Enroll failed'));

      const resultPromise = firstValueFrom(effects.enrollPractice$);
      actions$.next(FarmersActions.enrollPractice({ practiceId: 'cover-crops' }));
      const action = await resultPromise;

      expect(action).toEqual(
        FarmersActions.enrollPracticeFailure({ practiceId: 'cover-crops', error: 'Enroll failed' }),
      );
    });
  });

  describe('enrollPracticeSuccess$', () => {
    it('shows a success notification with the BMP name', async () => {
      const resultPromise = firstValueFrom(effects.enrollPracticeSuccess$);
      actions$.next(FarmersActions.enrollPracticeSuccess({ bmp: mockBmpEnrolled }));
      await resultPromise;

      expect(notificationServiceMock.success).toHaveBeenCalledWith(
        'Enrolled',
        expect.stringContaining('Cover Crops'),
      );
    });
  });

  describe('enrollPracticeFailure$', () => {
    it('shows an error notification', async () => {
      const resultPromise = firstValueFrom(effects.enrollPracticeFailure$);
      actions$.next(
        FarmersActions.enrollPracticeFailure({ practiceId: 'cover-crops', error: 'Enroll failed' }),
      );
      await resultPromise;

      expect(notificationServiceMock.error).toHaveBeenCalledWith(
        'Enrollment failed',
        'Enroll failed',
      );
    });
  });

  // ── Unenroll Practice ───────────────────────────────────────────────────────

  describe('unenrollPractice$', () => {
    it('emits unenrollPracticeSuccess with the practiceId on success', async () => {
      farmersServiceMock.unenrollBmp.mockResolvedValue(undefined);

      const resultPromise = firstValueFrom(effects.unenrollPractice$);
      actions$.next(FarmersActions.unenrollPractice({ practiceId: 'cover-crops' }));
      const action = await resultPromise;

      expect(action).toEqual(FarmersActions.unenrollPracticeSuccess({ practiceId: 'cover-crops' }));
      expect(farmersServiceMock.unenrollBmp).toHaveBeenCalledWith('cover-crops');
    });

    it('emits unenrollPracticeFailure on error', async () => {
      farmersServiceMock.unenrollBmp.mockRejectedValue(new Error('Unenroll failed'));

      const resultPromise = firstValueFrom(effects.unenrollPractice$);
      actions$.next(FarmersActions.unenrollPractice({ practiceId: 'cover-crops' }));
      const action = await resultPromise;

      expect(action).toEqual(
        FarmersActions.unenrollPracticeFailure({
          practiceId: 'cover-crops',
          error: 'Unenroll failed',
        }),
      );
    });
  });

  describe('unenrollPracticeSuccess$', () => {
    it('shows an info notification', async () => {
      const resultPromise = firstValueFrom(effects.unenrollPracticeSuccess$);
      actions$.next(FarmersActions.unenrollPracticeSuccess({ practiceId: 'cover-crops' }));
      await resultPromise;

      expect(notificationServiceMock.info).toHaveBeenCalledWith(
        'Unenrolled',
        expect.stringContaining('cover-crops'),
      );
    });
  });

  describe('unenrollPracticeFailure$', () => {
    it('shows an error notification', async () => {
      const resultPromise = firstValueFrom(effects.unenrollPracticeFailure$);
      actions$.next(
        FarmersActions.unenrollPracticeFailure({
          practiceId: 'cover-crops',
          error: 'Unenroll failed',
        }),
      );
      await resultPromise;

      expect(notificationServiceMock.error).toHaveBeenCalledWith(
        'Unenrollment failed',
        'Unenroll failed',
      );
    });
  });

  // ── mergeMap: concurrent card toggles ───────────────────────────────────────

  describe('enrollPractice$ — mergeMap allows concurrent card toggles', () => {
    it('processes two different cards concurrently', async () => {
      let resolveFirst!: (v: Bmp) => void;
      const firstCardPromise = new Promise<Bmp>((res) => {
        resolveFirst = res;
      });

      farmersServiceMock.enrollBmp
        .mockReturnValueOnce(firstCardPromise) // card A — hangs
        .mockResolvedValue({ ...mockBmp, id: 'no-till', enrolled: true }); // card B — resolves fast

      // Card B result arrives first
      const cardBPromise = firstValueFrom(effects.enrollPractice$);
      actions$.next(FarmersActions.enrollPractice({ practiceId: 'cover-crops' })); // card A
      actions$.next(FarmersActions.enrollPractice({ practiceId: 'no-till' })); // card B

      const cardBAction = await cardBPromise;
      expect((cardBAction as ReturnType<typeof FarmersActions.enrollPracticeSuccess>).bmp.id).toBe(
        'no-till',
      );

      // Both service calls were started (mergeMap, not exhaustMap)
      expect(farmersServiceMock.enrollBmp).toHaveBeenCalledTimes(2);

      // Resolve card A so there's no dangling promise
      resolveFirst(mockBmpEnrolled);
    });
  });
});
