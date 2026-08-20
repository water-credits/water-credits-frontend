import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { CreditsPortfolioComponent } from './credits-portfolio';
import * as RetirementActions from '../../../core/store/retirement/retirement.actions';
import {
  selectIsRetirementInProgress,
  selectRetirementPhase,
  selectActiveRetirement,
} from '../../../core/store/retirement/retirement.selectors';

describe('CreditsPortfolioComponent', () => {
  let component: CreditsPortfolioComponent;
  let fixture: ComponentFixture<CreditsPortfolioComponent>;
  let store: MockStore;

  const initialState = {
    retirement: {
      retirements: [],
      total: 0,
      page: 1,
      totalPages: 1,
      activeRetirement: null,
      certificate: null,
      phase: 'idle',
      loading: false,
      error: null,
    },
    credits: {
      portfolio: null,
      transactions: [],
      loading: false,
      error: null,
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreditsPortfolioComponent],
      providers: [provideRouter([]), provideMockStore({ initialState })],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(CreditsPortfolioComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('onRetireConfirm', () => {
    it('dispatches initiateRetirement with the correct RetirementRequest payload', () => {
      const dispatchSpy = vi.spyOn(store, 'dispatch');

      const event = { projectId: 'proj-1', amount: '500', purpose: 'offset' };
      (component as any).onRetireConfirm(event);

      expect(dispatchSpy).toHaveBeenCalledWith(
        RetirementActions.initiateRetirement({
          request: { projectId: 'proj-1', amount: '500', purpose: 'offset' },
        }),
      );
    });

    it('does NOT close the modal immediately after dispatch (stays open on failure)', () => {
      (component as any).showRetireModal = true;

      const event = { projectId: 'proj-1', amount: '500', purpose: 'offset' };
      (component as any).onRetireConfirm(event);

      expect((component as any).showRetireModal).toBe(true);
    });
  });

  describe('retirementLoading$ — loading state propagation', () => {
    it('emits true when the retirement phase is in progress', async () => {
      store.overrideSelector(selectIsRetirementInProgress, true);
      store.refreshState();

      const loading = await new Promise<boolean>((resolve) => {
        (component as any).retirementLoading$.subscribe((v: boolean) => resolve(v));
      });

      expect(loading).toBe(true);
    });

    it('emits false when the retirement phase is idle', async () => {
      store.overrideSelector(selectIsRetirementInProgress, false);
      store.refreshState();

      const loading = await new Promise<boolean>((resolve) => {
        (component as any).retirementLoading$.subscribe((v: boolean) => resolve(v));
      });

      expect(loading).toBe(false);
    });
  });

  describe('retirement phase propagation to modal', () => {
    it('passes retirement phase and active retirement to modal state', async () => {
      store.overrideSelector(selectRetirementPhase, 'confirmed');
      store.overrideSelector(selectActiveRetirement, { id: 'ret-999' } as any);
      store.refreshState();

      const phase = await new Promise<string>((resolve) => {
        (component as any).retirementPhase$.subscribe((v: string) => resolve(v));
      });
      const activeRetirement = await new Promise<any>((resolve) => {
        (component as any).activeRetirement$.subscribe((v: any) => resolve(v));
      });

      expect(phase).toBe('confirmed');
      expect(activeRetirement).toEqual({ id: 'ret-999' });
    });
  });
});
