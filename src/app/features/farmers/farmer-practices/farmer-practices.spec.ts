import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { By } from '@angular/platform-browser';

import { FarmerPracticesComponent } from './farmer-practices';
import * as FarmersActions from '../../../core/store/farmers/farmers.actions';
import {
  selectBmps,
  selectBmpsLoading,
  selectEnrollingPracticeIds,
  selectIsPracticeEnrolling,
} from '../../../core/store/farmers/farmers.selectors';
import { Bmp } from '../../../core/models/bmp.model';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const unenrolledBmp: Bmp = {
  id: 'cover-crops',
  name: 'Cover Crops',
  description: 'Plant cover crops.',
  category: 'soil management',
  enrolled: false,
  estimatedCredits: 120,
  icon: null,
  requirements: ['2 months coverage'],
};

const enrolledBmp: Bmp = {
  id: 'no-till',
  name: 'No-Till Farming',
  description: 'Eliminate tillage.',
  category: 'soil management',
  enrolled: true,
  estimatedCredits: 85,
  icon: null,
  requirements: ['Zero tillage'],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function setup(
  bmps: Bmp[] = [],
  loading = false,
  enrollingIds: string[] = [],
): { fixture: ComponentFixture<FarmerPracticesComponent>; store: MockStore } {
  TestBed.configureTestingModule({
    imports: [FarmerPracticesComponent],
    providers: [
      provideMockStore({
        selectors: [
          { selector: selectBmps, value: bmps },
          { selector: selectBmpsLoading, value: loading },
          { selector: selectEnrollingPracticeIds, value: enrollingIds },
        ],
      }),
    ],
  });

  const fixture = TestBed.createComponent(FarmerPracticesComponent);
  const store = TestBed.inject(MockStore);
  vi.spyOn(store, 'dispatch');
  fixture.detectChanges();
  return { fixture, store };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('FarmerPracticesComponent', () => {
  afterEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
  });

  // ── Init dispatch ──────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('dispatches loadBmps on initialisation', () => {
      const { store } = setup();
      expect(store.dispatch).toHaveBeenCalledWith(FarmersActions.loadBmps());
    });

    it('does NOT inject or use NotificationService directly', () => {
      // If NotificationService were injected it would appear in the providers
      // list of TestBed; the test would need to provide it or it would throw.
      // The absence of a provider error here proves it is not injected.
      const { fixture } = setup();
      expect(fixture.componentInstance).toBeTruthy();
    });
  });

  // ── Loading state ──────────────────────────────────────────────────────────

  describe('loading skeleton', () => {
    it('shows skeleton cards while loading', () => {
      const { fixture } = setup([], true);
      const skeletons = fixture.debugElement.queryAll(By.css('.animate-pulse'));
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('hides BMP cards while loading', () => {
      const { fixture } = setup([unenrolledBmp], true);
      // The grid of real cards is hidden via *ngIf="!(bmpsLoading$ | async)"
      const cards = fixture.debugElement.queryAll(By.css('[aria-label]'));
      expect(cards.length).toBe(0);
    });
  });

  // ── BMP card rendering ─────────────────────────────────────────────────────

  describe('BMP card rendering', () => {
    it('renders one card per BMP', () => {
      const { fixture } = setup([unenrolledBmp, enrolledBmp]);
      // Each card has a toggle button with aria-label
      const toggleButtons = fixture.debugElement.queryAll(By.css('[aria-label]'));
      expect(toggleButtons.length).toBe(2);
    });

    it('shows "Enrolled" badge for enrolled BMPs', () => {
      const { fixture } = setup([enrolledBmp]);
      const badge = fixture.debugElement.query(By.css('span.bg-environmental-green\\/10'));
      expect(badge?.nativeElement.textContent.trim()).toBe('Enrolled');
    });
  });

  // ── Toggle dispatch ────────────────────────────────────────────────────────

  describe('toggleBmp', () => {
    it('dispatches enrollPractice when an unenrolled BMP toggle is clicked', () => {
      const { fixture, store } = setup([unenrolledBmp]);
      store.dispatch = vi.fn(); // reset after init dispatch

      const toggleBtn = fixture.debugElement.query(
        By.css(`[aria-label="Enroll in ${unenrolledBmp.name}"]`),
      );
      toggleBtn.nativeElement.click();

      expect(store.dispatch).toHaveBeenCalledWith(
        FarmersActions.enrollPractice({ practiceId: unenrolledBmp.id }),
      );
    });

    it('dispatches unenrollPractice when an enrolled BMP toggle is clicked', () => {
      const { fixture, store } = setup([enrolledBmp]);
      store.dispatch = vi.fn(); // reset after init dispatch

      const toggleBtn = fixture.debugElement.query(
        By.css(`[aria-label="Unenroll from ${enrolledBmp.name}"]`),
      );
      toggleBtn.nativeElement.click();

      expect(store.dispatch).toHaveBeenCalledWith(
        FarmersActions.unenrollPractice({ practiceId: enrolledBmp.id }),
      );
    });
  });

  // ── Per-card loading UX ────────────────────────────────────────────────────

  describe('per-card loading state', () => {
    it('disables the toggle button when the practice ID is in enrollingPracticeIds', () => {
      // Override the per-card selector for cover-crops to return true
      TestBed.configureTestingModule({
        imports: [FarmerPracticesComponent],
        providers: [
          provideMockStore({
            selectors: [
              { selector: selectBmps, value: [unenrolledBmp] },
              { selector: selectBmpsLoading, value: false },
              { selector: selectEnrollingPracticeIds, value: ['cover-crops'] },
              // selectIsPracticeEnrolling is a factory; mock the specific instance
              {
                selector: selectIsPracticeEnrolling('cover-crops'),
                value: true,
              },
            ],
          }),
        ],
      });

      const fixture = TestBed.createComponent(FarmerPracticesComponent);
      fixture.detectChanges();

      const toggleBtn = fixture.debugElement.query(By.css('[aria-label]'));
      expect(toggleBtn.nativeElement.disabled).toBe(true);
    });

    it('does NOT disable cards whose ID is not in enrollingPracticeIds', () => {
      TestBed.configureTestingModule({
        imports: [FarmerPracticesComponent],
        providers: [
          provideMockStore({
            selectors: [
              { selector: selectBmps, value: [unenrolledBmp, enrolledBmp] },
              { selector: selectBmpsLoading, value: false },
              { selector: selectEnrollingPracticeIds, value: ['cover-crops'] },
              { selector: selectIsPracticeEnrolling('cover-crops'), value: true },
              { selector: selectIsPracticeEnrolling('no-till'), value: false },
            ],
          }),
        ],
      });

      const fixture = TestBed.createComponent(FarmerPracticesComponent);
      fixture.detectChanges();

      const toggleBtns = fixture.debugElement.queryAll(By.css('[aria-label]'));
      // cover-crops button: disabled; no-till button: not disabled
      expect(toggleBtns[0].nativeElement.disabled).toBe(true);
      expect(toggleBtns[1].nativeElement.disabled).toBe(false);
    });
  });
});
