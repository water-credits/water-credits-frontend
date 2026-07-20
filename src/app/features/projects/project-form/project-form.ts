import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor, NgSwitch, NgSwitchCase } from '@angular/common';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { Subject, takeUntil } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';
import { ProjectsService } from '../../../core/services/projects.service';
import { ProjectCreate } from '../../../core/models/project.model';
import * as ProjectsActions from '../../../core/store/projects/projects.actions';
import {
  LucideAngularModule,
  ChevronLeft,
  Check,
  Droplets,
  MapPin,
  FileText,
  ClipboardList,
} from 'lucide-angular';
import { FormStep } from '../../../core/models/shared-interfaces.model';

@Component({
  selector: 'app-project-form',
  standalone: true,
  imports: [RouterLink, FormsModule, NgIf, NgFor, NgSwitch, NgSwitchCase, LucideAngularModule],
  template: `
    <div class="max-w-3xl mx-auto">
      <a
        routerLink="/projects"
        class="inline-flex items-center gap-1 text-sm text-stellar-blue hover:text-stellar-blue-light mb-6"
      >
        <lucide-angular [img]="ChevronLeft" class="w-4 h-4"></lucide-angular>
        Back to Projects
      </a>

      <div class="card p-6">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          {{ isEdit ? 'Edit Project' : 'New Project' }}
        </h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Fill in the details to {{ isEdit ? 'update your' : 'register a new' }} water credit
          project.
        </p>

        <div class="flex items-center justify-between mb-8">
          <div *ngFor="let step of steps; let i = index" class="flex items-center">
            <div
              [class]="{
                'bg-stellar-blue text-white': i <= currentStep,
                'bg-slate-200 dark:bg-slate-700 text-slate-500': i > currentStep,
                'bg-environmental-green text-white': i < currentStep,
              }"
              class="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
            >
              <lucide-angular
                *ngIf="i < currentStep"
                [img]="Check"
                class="w-5 h-5"
              ></lucide-angular>
              <lucide-angular
                *ngIf="i >= currentStep"
                [img]="step.icon"
                class="w-5 h-5"
              ></lucide-angular>
            </div>
            <div
              *ngIf="i < steps.length - 1"
              [class]="{
                'bg-stellar-blue': i < currentStep,
                'bg-slate-200 dark:bg-slate-700': i >= currentStep,
              }"
              class="w-16 h-0.5 mx-2 transition-colors"
            ></div>
          </div>
        </div>

        <div class="mb-6">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-1">
            {{ steps[currentStep].label }}
          </h2>
          <p class="text-sm text-slate-500">{{ steps[currentStep].description }}</p>
        </div>

        <ng-container [ngSwitch]="currentStep">
          <div *ngSwitchCase="0" class="space-y-4">
            <div>
              <label class="label">Project Name *</label>
              <input
                type="text"
                [(ngModel)]="form.name"
                class="input"
                placeholder="e.g., Clear Water Valley Restoration"
                required
              />
            </div>
            <div>
              <label class="label">Description *</label>
              <textarea
                [(ngModel)]="form.description"
                class="input min-h-[100px]"
                placeholder="Describe the project location, methods, and expected impact..."
                required
              ></textarea>
            </div>
            <div>
              <label class="label">Methodology *</label>
              <select [(ngModel)]="form.methodology" class="input">
                <option value="">Select methodology...</option>
                <option value="water-quality-credits-v1">Water Quality Credits v1</option>
                <option value="nutrient-reduction-v1">Nutrient Reduction v1</option>
                <option value="sediment-reduction-v1">Sediment Reduction v1</option>
              </select>
            </div>
          </div>

          <div *ngSwitchCase="1" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="label">Latitude *</label>
                <input
                  type="number"
                  [(ngModel)]="form.latitude"
                  class="input"
                  placeholder="e.g., 41.403"
                  step="any"
                />
              </div>
              <div>
                <label class="label">Longitude *</label>
                <input
                  type="number"
                  [(ngModel)]="form.longitude"
                  class="input"
                  placeholder="e.g., 2.174"
                  step="any"
                />
              </div>
            </div>
            <div>
              <label class="label">Area (hectares) *</label>
              <input
                type="number"
                [(ngModel)]="form.areaHectares"
                class="input"
                placeholder="e.g., 100"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div *ngSwitchCase="2" class="space-y-4">
            <div>
              <label class="label">Baseline Start Date *</label>
              <input type="date" [(ngModel)]="form.baselineStart" class="input" />
            </div>
            <div>
              <label class="label">Baseline End Date *</label>
              <input type="date" [(ngModel)]="form.baselineEnd" class="input" />
            </div>
          </div>

          <div *ngSwitchCase="3" class="space-y-3">
            <div class="bg-slate-50 dark:bg-dark-bg rounded-lg p-4 space-y-3">
              <h3 class="font-medium text-slate-900 dark:text-white">Review Project Details</h3>
              <div class="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span class="text-slate-400">Name:</span>
                  <span class="font-medium">{{ form.name }}</span>
                </div>
                <div>
                  <span class="text-slate-400">Methodology:</span>
                  <span class="font-medium">{{ form.methodology }}</span>
                </div>
                <div>
                  <span class="text-slate-400">Area:</span>
                  <span class="font-medium">{{ form.areaHectares }} ha</span>
                </div>
                <div>
                  <span class="text-slate-400">Location:</span>
                  <span class="font-medium"
                    >{{ form.latitude.toFixed(4) }}, {{ form.longitude.toFixed(4) }}</span
                  >
                </div>
                <div>
                  <span class="text-slate-400">Baseline:</span>
                  <span class="font-medium"
                    >{{ form.baselineStart }} to {{ form.baselineEnd }}</span
                  >
                </div>
              </div>
              <p class="text-sm text-slate-500 mt-2">{{ form.description }}</p>
            </div>
          </div>
        </ng-container>

        <div class="flex justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
          <button *ngIf="currentStep > 0" (click)="prevStep()" class="btn btn-outline">
            Previous
          </button>
          <button *ngIf="currentStep === 0" (click)="cancel()" class="btn btn-outline">
            Cancel
          </button>
          <div class="flex gap-3 ml-auto">
            <button
              *ngIf="currentStep < 3"
              (click)="nextStep()"
              [disabled]="!canProceed"
              class="btn btn-primary"
            >
              Next
            </button>
            <button
              *ngIf="currentStep === 3"
              (click)="save()"
              [disabled]="saving"
              class="btn btn-primary flex items-center gap-2"
            >
              <svg
                *ngIf="saving"
                class="animate-spin w-4 h-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                ></path>
              </svg>
              {{ saving ? 'Creating...' : isEdit ? 'Update Project' : 'Create Project' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ProjectFormComponent implements OnInit, OnDestroy {
  protected currentStep = 0;
  protected saving = false;
  protected isEdit = false;
  protected form: ProjectCreate = {
    name: '',
    description: '',
    latitude: 0,
    longitude: 0,
    methodology: '',
    areaHectares: 0,
    baselineStart: '',
    baselineEnd: '',
  };

  protected steps: FormStep[] = [
    {
      label: 'Basic Info',
      icon: ClipboardList,
      description: 'Provide the basic information about your project.',
    },
    {
      label: 'Location',
      icon: MapPin,
      description: 'Set the geographic location and size of your project.',
    },
    { label: 'Timeline', icon: FileText, description: 'Define the baseline monitoring period.' },
    { label: 'Review', icon: Check, description: 'Review your project details before submitting.' },
  ];

  protected readonly ChevronLeft = ChevronLeft;
  protected readonly Check = Check;
  protected readonly Droplets = Droplets;
  protected readonly MapPin = MapPin;
  protected readonly FileText = FileText;
  protected readonly ClipboardList = ClipboardList;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store,
    private actions$: Actions,
    private projectsService: ProjectsService,
    private notificationService: NotificationService,
  ) {}

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      try {
        const project = await this.projectsService.getProject(id);
        this.form = {
          name: project.name,
          description: project.description,
          latitude: project.latitude,
          longitude: project.longitude,
          methodology: project.methodology,
          areaHectares: project.areaHectares,
          baselineStart: project.baselineStart?.split('T')[0] || '',
          baselineEnd: project.baselineEnd?.split('T')[0] || '',
        };
      } catch {
        this.notificationService.error('Error', 'Failed to load project for editing');
        this.router.navigate(['/projects']);
      }
    }

    // Navigate to the new project page after a successful create dispatched via the store.
    this.actions$
      .pipe(ofType(ProjectsActions.createProjectSuccess), takeUntil(this.destroy$))
      .subscribe(({ project }) => {
        this.notificationService.success(
          'Project created',
          `${project.name} has been registered successfully`,
        );
        this.saving = false;
        this.router.navigate(['/projects', project.id]);
      });

    // Surface field-level API errors back to the form.
    this.actions$
      .pipe(ofType(ProjectsActions.createProjectFailure), takeUntil(this.destroy$))
      .subscribe(({ error }) => {
        this.notificationService.error('Failed to create project', error);
        this.saving = false;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get canProceed(): boolean {
    switch (this.currentStep) {
      case 0:
        return !!this.form.name && !!this.form.description && !!this.form.methodology;
      case 1:
        return !!this.form.latitude && !!this.form.longitude && this.form.areaHectares > 0;
      case 2:
        return !!this.form.baselineStart && !!this.form.baselineEnd;
      default:
        return true;
    }
  }

  nextStep(): void {
    if (this.canProceed) this.currentStep++;
  }

  prevStep(): void {
    if (this.currentStep > 0) this.currentStep--;
  }

  cancel(): void {
    this.router.navigate(['/projects']);
  }

  save(): void {
    if (this.saving) return;
    this.saving = true;
    // Dispatch through the store; success/failure are handled via Actions stream above.
    this.store.dispatch(ProjectsActions.createProject({ data: this.form }));
  }
}
