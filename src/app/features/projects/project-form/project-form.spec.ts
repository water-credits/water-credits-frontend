import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { provideMockActions } from '@ngrx/effects/testing';
import { Subject } from 'rxjs';

import { reducers } from '../../../core/store/app.state';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ProjectFormComponent } from './project-form';

describe('ProjectFormComponent', () => {
  let component: ProjectFormComponent;
  let fixture: ComponentFixture<ProjectFormComponent>;
  let confirmService: { confirm: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    confirmService = { confirm: vi.fn() };
    const actions$ = new Subject();

    await TestBed.configureTestingModule({
      imports: [ProjectFormComponent],
      providers: [
        provideRouter([]),
        provideStore(reducers),
        provideMockActions(() => actions$),
        { provide: ConfirmService, useValue: confirmService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectFormComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('canDeactivate', () => {
    it('returns true when the form has been submitted', () => {
      (component as unknown as { submitted: boolean }).submitted = true;
      expect(component.canDeactivate()).toBe(true);
    });

    it('returns true when no form state is dirty and no docs are attached', () => {
      expect(component.canDeactivate()).toBe(true);
    });

    it('asks ConfirmService when there are unsaved changes', () => {
      (component as any).step0.get('name').markAsDirty();
      confirmService.confirm.mockReturnValue(Promise.resolve(false));

      const result = component.canDeactivate();

      expect(confirmService.confirm).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Promise);
    });

    it('resolves true when the user confirms discarding changes', async () => {
      (component as any).step0.get('name').markAsDirty();
      confirmService.confirm.mockResolvedValue(true);

      await expect(component.canDeactivate()).resolves.toBe(true);
    });

    it('resolves false when the user cancels', async () => {
      (component as any).step0.get('name').markAsDirty();
      confirmService.confirm.mockResolvedValue(false);

      await expect(component.canDeactivate()).resolves.toBe(false);
    });
  });
});
