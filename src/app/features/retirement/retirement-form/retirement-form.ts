import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor, NgSwitch, NgSwitchCase, NgClass } from '@angular/common';
import {
  LucideAngularModule,
  ChevronLeft,
  Check,
  Search,
  Droplets,
  FileText,
  ClipboardList,
} from 'lucide-angular';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ProjectsService } from '../../../core/services/projects.service';
import { RetirementRequest } from '../../../core/models/retirement.model';
import { Project } from '../../../core/models/project.model';
import { NumberAbbreviatePipe } from '../../../shared/pipes/number-abbreviate.pipe';
import { FormStep } from '../../../core/models/shared-interfaces.model';
import { initiateRetirement } from '../../../core/store/retirement/retirement.actions';
import { selectRetirementPhase } from '../../../core/store/retirement/retirement.selectors';

const PURPOSE_OPTIONS = [
  'Carbon Offset',
  'Sustainability Report',
  'Regulatory Compliance',
  'Voluntary Retirement',
  'Other',
];

@Component({
  selector: 'app-retirement-form',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    NgIf,
    NgFor,
    NgSwitch,
    NgSwitchCase,
    NgClass,
    LucideAngularModule,
    NumberAbbreviatePipe,
  ],
  template: `
    <div class="max-w-3xl mx-auto">
      <a
        routerLink="/retirement"
        class="inline-flex items-center gap-1 text-sm text-stellar-blue hover:text-stellar-blue-light mb-6"
      >
        <lucide-angular [img]="ChevronLeft" class="w-4 h-4"></lucide-angular>
        Back to Retirement History
      </a>

      <div class="card p-6">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">Retire Credits</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Permanently retire water quality credits to offset your environmental impact.
        </p>

        <!-- Step indicator -->
        <div class="flex items-center justify-between mb-8">
          <div *ngFor="let step of steps; let i = index" class="flex items-center">
            <div
              [ngClass]="{
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
              [ngClass]="{
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
          <!-- Step 0: Project selection -->
          <div *ngSwitchCase="0" class="space-y-4">
            <div class="relative">
              <lucide-angular
                [img]="Search"
                class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              ></lucide-angular>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (input)="filterProjects()"
                class="input pl-10"
                placeholder="Search projects..."
              />
            </div>
            <div class="max-h-[320px] overflow-y-auto space-y-2">
              <button
                *ngFor="let project of filteredProjects"
                (click)="selectProject(project)"
                [ngClass]="{
                  'border-stellar-blue ring-1 ring-stellar-blue':
                    selectedProject?.id === project.id,
                  'border-slate-200 dark:border-slate-700 hover:border-stellar-blue/50':
                    selectedProject?.id !== project.id,
                }"
                class="w-full text-left p-4 rounded-lg border bg-white dark:bg-dark-bg-lighter transition-all"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-medium text-slate-900 dark:text-white">{{ project.name }}</p>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {{ project.methodology }} &middot; {{ project.areaHectares }} ha
                    </p>
                  </div>
                  <span class="text-xs font-medium text-stellar-blue"
                    >{{ project.totalCreditsMinted ?? 0 | numberAbbreviate }} credits</span
                  >
                </div>
              </button>
              <div
                *ngIf="filteredProjects.length === 0"
                class="text-center py-8 text-sm text-slate-400"
              >
                No projects found matching "{{ searchQuery }}"
              </div>
            </div>
          </div>

          <!-- Step 1: Amount -->
          <div *ngSwitchCase="1" class="space-y-4">
            <div>
              <label class="label">Amount of Credits to Retire *</label>
              <div class="relative">
                <input
                  type="number"
                  [(ngModel)]="amount"
                  min="1"
                  step="0.01"
                  class="input pl-8"
                  placeholder="e.g., 100"
                />
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400"
                  >#</span
                >
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                Enter the number of water quality credits you wish to permanently retire.
              </p>
            </div>
            <div *ngIf="selectedProject" class="bg-slate-50 dark:bg-dark-bg rounded-lg p-3 text-sm">
              <span class="text-slate-500">Selected project:</span>
              <span class="font-medium text-slate-900 dark:text-white ml-1">{{
                selectedProject.name
              }}</span>
            </div>
          </div>

          <!-- Step 2: Purpose -->
          <div *ngSwitchCase="2" class="space-y-4">
            <div>
              <label class="label">Retirement Purpose *</label>
              <select [(ngModel)]="purpose" class="input">
                <option value="">Select a purpose...</option>
                <option *ngFor="let opt of purposeOptions" [value]="opt">{{ opt }}</option>
              </select>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                Choose the reason for retiring these credits.
              </p>
            </div>
          </div>

          <!-- Step 3: Review & confirm -->
          <div *ngSwitchCase="3" class="space-y-4">
            <!-- Awaiting-signature banner -->
            <div
              *ngIf="phase === 'awaiting_signature'"
              class="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-700/30 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-300 flex items-center gap-3"
            >
              <svg
                class="animate-spin w-5 h-5 shrink-0"
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
              <div>
                <p class="font-medium">Waiting for wallet signature</p>
                <p class="mt-0.5 text-blue-700 dark:text-blue-400">
                  Please approve the transaction in your Freighter wallet.
                </p>
              </div>
            </div>

            <div class="bg-slate-50 dark:bg-dark-bg rounded-lg p-5 space-y-4">
              <h3 class="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                <lucide-angular
                  [img]="ClipboardList"
                  class="w-5 h-5 text-stellar-blue"
                ></lucide-angular>
                Review Retirement
              </h3>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div><span class="text-slate-400">Project:</span></div>
                <div class="font-medium text-slate-900 dark:text-white text-right">
                  {{ selectedProject?.name }}
                </div>
                <div><span class="text-slate-400">Amount:</span></div>
                <div class="font-medium text-slate-900 dark:text-white text-right">
                  {{ amount }} credits
                </div>
                <div><span class="text-slate-400">Purpose:</span></div>
                <div class="font-medium text-slate-900 dark:text-white text-right capitalize">
                  {{ purpose }}
                </div>
                <div><span class="text-slate-400">Methodology:</span></div>
                <div class="font-medium text-slate-900 dark:text-white text-right">
                  {{ selectedProject?.methodology }}
                </div>
              </div>
            </div>
            <div
              class="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30 rounded-lg p-4 text-sm text-amber-800 dark:text-amber-300"
            >
              <p class="font-medium">Important</p>
              <p class="mt-1">
                Retiring credits is irreversible. Once retired, these credits will be permanently
                removed from circulation and recorded on-chain.
              </p>
            </div>
          </div>
        </ng-container>

        <!-- Navigation buttons -->
        <div class="flex justify-between mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
          <button
            *ngIf="currentStep > 0"
            (click)="prevStep()"
            [disabled]="inProgress"
            class="btn btn-outline"
          >
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
              Continue
            </button>
            <button
              *ngIf="currentStep === 3"
              (click)="confirm()"
              [disabled]="inProgress"
              class="btn btn-primary flex items-center gap-2"
            >
              <svg
                *ngIf="inProgress"
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
              {{ inProgress ? 'Processing...' : 'Confirm & Retire' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class RetirementFormComponent implements OnInit, OnDestroy {
  protected currentStep = 0;

  protected projects: Project[] = [];
  protected filteredProjects: Project[] = [];
  protected selectedProject: Project | null = null;
  protected amount: number | null = null;
  protected purpose = '';
  protected searchQuery = '';
  protected purposeOptions = PURPOSE_OPTIONS;

  /** Current wizard phase mirrored from the store for template bindings. */
  protected phase = 'idle';

  /** True when any async operation is in-flight — disables the confirm button. */
  protected inProgress = false;

  protected readonly ChevronLeft = ChevronLeft;
  protected readonly Check = Check;
  protected readonly Search = Search;
  protected readonly Droplets = Droplets;
  protected readonly FileText = FileText;
  protected readonly ClipboardList = ClipboardList;

  protected steps: FormStep[] = [
    {
      label: 'Project',
      icon: Search,
      description: 'Select the water quality project to retire credits from.',
    },
    { label: 'Amount', icon: Droplets, description: 'Enter the number of credits to retire.' },
    { label: 'Purpose', icon: FileText, description: 'Choose the reason for this retirement.' },
    {
      label: 'Review',
      icon: Check,
      description: 'Review and confirm your retirement. Your wallet will be prompted to sign.',
    },
  ];

  private readonly destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private projectsService: ProjectsService,
    private store: Store,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadProjects();
    this.watchPhase();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Mirror store phase into local property for template use. */
  private watchPhase(): void {
    this.store
      .select(selectRetirementPhase)
      .pipe(takeUntil(this.destroy$))
      .subscribe((phase) => {
        this.phase = phase;
        this.inProgress =
          phase === 'preparing' || phase === 'awaiting_signature' || phase === 'submitting';

        // If the user rejected the signature, the effect returns the phase to
        // 'idle' — keep the form on the review step (step 3) so they can retry.
      });

    // When the retirement is signature-rejected, keep user on review step.
    // The notification is shown by the effect; no navigation needed here.
  }

  private async loadProjects(): Promise<void> {
    try {
      const response = await this.projectsService.getProjects({ limit: 100 });
      this.projects = response.data;
      this.filteredProjects = this.projects;
    } catch {
      this.projects = [];
      this.filteredProjects = [];
    }
  }

  protected filterProjects(): void {
    const query = this.searchQuery.toLowerCase();
    this.filteredProjects = this.projects.filter(
      (p) => p.name.toLowerCase().includes(query) || p.methodology.toLowerCase().includes(query),
    );
  }

  protected selectProject(project: Project): void {
    this.selectedProject = project;
  }

  get canProceed(): boolean {
    switch (this.currentStep) {
      case 0:
        return !!this.selectedProject;
      case 1:
        return !!this.amount && this.amount > 0;
      case 2:
        return !!this.purpose;
      default:
        return true;
    }
  }

  protected nextStep(): void {
    if (this.canProceed) this.currentStep++;
  }

  protected prevStep(): void {
    if (this.currentStep > 0 && !this.inProgress) this.currentStep--;
  }

  protected cancel(): void {
    this.router.navigate(['/retirement']);
  }

  /**
   * Dispatches `initiateRetirement` to the NgRx store.
   * The RetirementEffects take over from here via exhaustMap — a second click
   * while the effect is running is silently dropped.
   */
  protected confirm(): void {
    if (!this.selectedProject || !this.amount || !this.purpose) return;
    if (this.inProgress) return; // exhaustMap guard in the effect, but also safe here

    const request: RetirementRequest = {
      projectId: this.selectedProject.id,
      amount: String(this.amount),
      purpose: this.purpose,
    };

    this.store.dispatch(initiateRetirement({ request }));
  }
}
