import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { vi } from 'vitest';

import { ProjectFormComponent } from './project-form';
import { ApiService } from '../../../core/services/api.service';
import { ProjectsService } from '../../../core/services/projects.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import * as ProjectsActions from '../../../core/store/projects/projects.actions';
import { ProjectsState } from '../../../core/store/projects/projects.reducer';

/**
 * Test-only typed view of the component internals.
 *
 * `saving`, `submitted` and `storeError` are deliberately `protected` on the
 * component — they are template-only state and should not widen the public
 * surface area. The tests need to assert on them, so we cast through a narrow
 * structural type rather than reaching for `any`.
 */
interface ComponentInternals {
  saving: boolean;
  submitted: boolean;
  storeError: string | null;
}
function internals(c: ProjectFormComponent): ComponentInternals {
  return c as unknown as ComponentInternals;
}

const projectsState: ProjectsState = {
  projects: [],
  selectedProject: null,
  filters: {},
  total: 0,
  page: 1,
  limit: 10,
  totalPages: 0,
  lastFetched: null,
  loading: false,
  error: null,
};

const initialState = { projects: projectsState };

/** Pushes a new `projects` slice into the MockStore so the real selectors re-emit. */
function setProjectsState(store: MockStore, patch: Partial<ProjectsState>): void {
  store.setState({ projects: { ...projectsState, ...patch } });
}

describe('ProjectFormComponent', () => {
  let component: ProjectFormComponent;
  let fixture: ComponentFixture<ProjectFormComponent>;
  let store: MockStore;
  let notificationService: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let confirmService: { confirm: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    notificationService = { success: vi.fn(), error: vi.fn() };
    confirmService = { confirm: vi.fn() };

    // Note: `provideMockActions` is deliberately absent. The component must no
    // longer inject `Actions`, so leaving it unprovided means a regression would
    // fail every test in this file with a NullInjectorError.
    await TestBed.configureTestingModule({
      imports: [ProjectFormComponent],
      providers: [
        provideRouter([]),
        provideMockStore({ initialState }),
        { provide: NotificationService, useValue: notificationService },
        { provide: ConfirmService, useValue: confirmService },
        { provide: ProjectsService, useValue: { getProject: vi.fn() } },
        { provide: ApiService, useValue: { uploadFile: vi.fn() } },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(ProjectFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('does not inject the Actions stream', () => {
    // The TestBed deliberately does not provide `provideMockActions`, so the
    // component would fail to construct at all if it still injected `Actions`.
    // This assertion pins the absence of the field itself.
    expect((component as unknown as Record<string, unknown>)['actions$']).toBeUndefined();
  });

  describe('submit', () => {
    /** Fills every step with valid values so the dispatched payload is meaningful. */
    function fillForm(): void {
      component.step0.setValue({
        name: 'Clear Water Valley',
        description: 'Restoration of the valley wetlands.',
        methodology: 'water-quality-credits-v1',
      });
      component.step1.setValue({ latitude: 41.4, longitude: -90.2 });
      component.step2.setValue({
        areaHectares: 50,
        expectedAnnualCredits: 1200,
        verifierOrg: '',
        baselineStart: '2025-01-01',
        projectStartDate: '2025-06-01',
      });
    }

    it('dispatches createProject with the form payload', () => {
      const dispatchSpy = vi.spyOn(store, 'dispatch');
      fillForm();

      component.submit();

      expect(dispatchSpy).toHaveBeenCalledWith(
        ProjectsActions.createProject({
          data: {
            name: 'Clear Water Valley',
            description: 'Restoration of the valley wetlands.',
            methodology: 'water-quality-credits-v1',
            latitude: 41.4,
            longitude: -90.2,
            areaHectares: 50,
            baselineStart: '2025-01-01',
            baselineEnd: '2025-06-01',
          },
        }),
      );
    });

    it('marks the form as submitted before dispatching so PendingChangesGuard allows navigation', () => {
      fillForm();
      component.step0.markAsDirty();

      let submittedAtDispatch: boolean | undefined;
      const sub = store.scannedActions$.subscribe((action) => {
        if (action.type === ProjectsActions.createProject.type) {
          submittedAtDispatch = internals(component).submitted;
        }
      });
      // scannedActions$ replays the last action on subscribe; ignore that one.
      submittedAtDispatch = undefined;

      component.submit();
      sub.unsubscribe();

      expect(submittedAtDispatch).toBe(true);
      // `submitted` short-circuits the guard, so no prompt is raised on the way out.
      expect(component.canDeactivate()).toBe(true);
      expect(confirmService.confirm).not.toHaveBeenCalled();
    });

    it('does not raise the success notification itself (that belongs to ProjectsEffects)', () => {
      fillForm();

      component.submit();

      expect(notificationService.success).not.toHaveBeenCalled();
    });

    it('ignores a second submit while the store reports the create as in flight', () => {
      setProjectsState(store, { loading: true });
      const dispatchSpy = vi.spyOn(store, 'dispatch');

      component.submit();

      expect(dispatchSpy).not.toHaveBeenCalled();
    });
  });

  describe('store-driven state', () => {
    it('drives saving from selectProjectsLoading', () => {
      expect(internals(component).saving).toBe(false);

      setProjectsState(store, { loading: true });
      expect(internals(component).saving).toBe(true);

      setProjectsState(store, { loading: false });
      expect(internals(component).saving).toBe(false);
    });

    it('renders a notification and the inline banner when the store reports an error', () => {
      setProjectsState(store, { error: 'Name already taken' });
      // The field is assigned from an RxJS subscription, which does not mark the
      // view dirty in the zoneless TestBed (the app itself runs with zones).
      fixture.changeDetectorRef.markForCheck();
      fixture.detectChanges();

      expect(notificationService.error).toHaveBeenCalledWith(
        'Failed to create project',
        'Name already taken',
      );
      expect(internals(component).storeError).toBe('Name already taken');
      expect(fixture.nativeElement.textContent).toContain('Name already taken');
    });

    it('clears submitted on error so the guard protects the form again', () => {
      internals(component).submitted = true;

      setProjectsState(store, { error: 'Boom' });

      expect(internals(component).submitted).toBe(false);
    });

    it('does not notify for an error that was already in the store when the form loaded', async () => {
      // A stale error left over from an earlier failed request must not surface
      // as a toast on a freshly opened form.
      fixture.destroy(); // tear down the form from beforeEach so only the new one listens
      store.setState({ projects: { ...projectsState, error: 'Stale failure' } });
      notificationService.error.mockClear();

      const staleFixture = TestBed.createComponent(ProjectFormComponent);
      staleFixture.detectChanges();
      await staleFixture.whenStable();

      expect(notificationService.error).not.toHaveBeenCalled();
    });
  });

  describe('canDeactivate', () => {
    it('returns true when the form has been submitted', () => {
      internals(component).submitted = true;
      expect(component.canDeactivate()).toBe(true);
    });

    it('returns true when no form state is dirty and no docs are attached', () => {
      expect(component.canDeactivate()).toBe(true);
    });

    it('asks ConfirmService when there are unsaved changes', () => {
      component.step0.get('name')!.markAsDirty();
      confirmService.confirm.mockReturnValue(Promise.resolve(false));

      const result = component.canDeactivate();

      expect(confirmService.confirm).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Promise);
    });

    it('resolves true when the user confirms discarding changes', async () => {
      component.step0.get('name')!.markAsDirty();
      confirmService.confirm.mockResolvedValue(true);

      await expect(component.canDeactivate()).resolves.toBe(true);
    });

    it('resolves false when the user cancels', async () => {
      component.step0.get('name')!.markAsDirty();
      confirmService.confirm.mockResolvedValue(false);

      await expect(component.canDeactivate()).resolves.toBe(false);
    });

    it('returns false when the form is dirty and the user cancels the confirm prompt', async () => {
      component.step0.markAsDirty();
      confirmService.confirm.mockResolvedValue(false);

      await expect(component.canDeactivate()).resolves.toBe(false);
      // Pin the prompt copy and the destructive styling, not just the fact of the call.
      expect(confirmService.confirm).toHaveBeenCalledWith({
        title: 'Unsaved changes',
        message: 'You have unsaved changes. Leave this page and discard them?',
        confirmLabel: 'Discard',
        confirmVariant: 'danger',
      });
    });

    it('returns true when the form is dirty and the user accepts the confirm prompt', async () => {
      component.step0.markAsDirty();
      confirmService.confirm.mockResolvedValue(true);

      await expect(component.canDeactivate()).resolves.toBe(true);
      expect(confirmService.confirm).toHaveBeenCalledTimes(1);
    });

    it('returns true when the form is pristine, without prompting at all', () => {
      expect(component.canDeactivate()).toBe(true);
      expect(confirmService.confirm).not.toHaveBeenCalled();
    });
  });
});
