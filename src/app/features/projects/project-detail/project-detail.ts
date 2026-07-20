import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { map, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { NgIf, AsyncPipe } from '@angular/common';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';
import { CreditAmountPipe } from '../../../shared/pipes/credit-amount.pipe';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import { StellarAddressPipe } from '../../../shared/pipes/stellar-address.pipe';
import { Project } from '../../../core/models/project.model';
import * as ProjectsActions from '../../../core/store/projects/projects.actions';
import {
  selectSelectedProject,
  selectProjectsLoading,
} from '../../../core/store/projects/projects.selectors';
import {
  LucideAngularModule,
  ArrowLeft,
  MapPin,
  Calendar,
  Ruler,
  FileText,
  Activity,
} from 'lucide-angular';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [
    RouterLink,
    NgIf,
    AsyncPipe,
    StatusBadgeComponent,
    LoadingSpinnerComponent,
    CreditAmountPipe,
    DateFormatPipe,
    StellarAddressPipe,
    LucideAngularModule,
  ],
  template: `
    <div *ngIf="loading$ | async" class="py-20">
      <app-loading-spinner size="lg" label="Loading project..."></app-loading-spinner>
    </div>

    <ng-container *ngIf="!(loading$ | async) && project">
      <div class="mb-6">
        <a
          routerLink="/projects"
          class="inline-flex items-center gap-1 text-sm text-stellar-blue hover:text-stellar-blue-light mb-4"
        >
          <lucide-angular [img]="ArrowLeft" class="w-4 h-4"></lucide-angular>
          Back to Projects
        </a>
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <h1 class="text-2xl font-bold text-slate-900 dark:text-white">{{ project.name }}</h1>
              <app-status-badge [status]="project.status"></app-status-badge>
            </div>
            <p class="text-sm text-slate-500 dark:text-slate-400">{{ project.description }}</p>
          </div>
          <div class="flex gap-2">
            <a [routerLink]="['/projects', project.id, 'edit']" class="btn btn-outline text-sm"
              >Edit</a
            >
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-6">
          <div class="card p-5">
            <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Project Details
            </h2>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-slate-400 uppercase tracking-wider mb-1">Methodology</p>
                <p class="text-sm font-medium">{{ project.methodology }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400 uppercase tracking-wider mb-1">Area</p>
                <p class="text-sm font-medium flex items-center gap-1">
                  <lucide-angular [img]="Ruler" class="w-3.5 h-3.5 text-slate-400"></lucide-angular>
                  {{ project.areaHectares }} hectares
                </p>
              </div>
              <div>
                <p class="text-xs text-slate-400 uppercase tracking-wider mb-1">Location</p>
                <p class="text-sm font-medium flex items-center gap-1">
                  <lucide-angular
                    [img]="MapPin"
                    class="w-3.5 h-3.5 text-slate-400"
                  ></lucide-angular>
                  {{ project.latitude.toFixed(4) }}, {{ project.longitude.toFixed(4) }}
                </p>
              </div>
              <div>
                <p class="text-xs text-slate-400 uppercase tracking-wider mb-1">Baseline Period</p>
                <p class="text-sm font-medium flex items-center gap-1">
                  <lucide-angular
                    [img]="Calendar"
                    class="w-3.5 h-3.5 text-slate-400"
                  ></lucide-angular>
                  {{ project.baselineStart | dateFormat: 'short' }} -
                  {{ project.baselineEnd | dateFormat: 'short' }}
                </p>
              </div>
              <div>
                <p class="text-xs text-slate-400 uppercase tracking-wider mb-1">Owner</p>
                <p class="text-sm font-mono">{{ project.ownerId | stellarAddress }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400 uppercase tracking-wider mb-1">Created</p>
                <p class="text-sm font-medium">{{ project.createdAt | dateFormat: 'medium' }}</p>
              </div>
            </div>
          </div>

          <div class="card p-5">
            <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Credit Activity
            </h2>
            <div class="grid grid-cols-3 gap-4">
              <div class="bg-slate-50 dark:bg-dark-bg rounded-lg p-4 text-center">
                <p class="text-xs text-slate-400 mb-1">Minted</p>
                <p class="text-xl font-bold text-stellar-blue">
                  {{ project.totalCreditsMinted || 0 | creditAmount }}
                </p>
              </div>
              <div class="bg-slate-50 dark:bg-dark-bg rounded-lg p-4 text-center">
                <p class="text-xs text-slate-400 mb-1">Retired</p>
                <p class="text-xl font-bold text-environmental-green">
                  {{ project.totalCreditsRetired || 0 | creditAmount }}
                </p>
              </div>
              <div class="bg-slate-50 dark:bg-dark-bg rounded-lg p-4 text-center">
                <p class="text-xs text-slate-400 mb-1">Price</p>
                <p class="text-xl font-bold text-credit-gold">
                  {{ project.creditPrice ? '$' + project.creditPrice : 'N/A' }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div class="card p-5">
            <h3
              class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2"
            >
              <lucide-angular [img]="FileText" class="w-4 h-4 text-stellar-blue"></lucide-angular>
              Documents
            </h3>
            <div class="text-center py-6 text-sm text-slate-400">No documents uploaded</div>
          </div>

          <div class="card p-5">
            <h3
              class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2"
            >
              <lucide-angular [img]="Activity" class="w-4 h-4 text-stellar-blue"></lucide-angular>
              Recent Activity
            </h3>
            <div class="text-center py-6 text-sm text-slate-400">No recent activity</div>
          </div>
        </div>
      </div>
    </ng-container>
  `,
})
export class ProjectDetailComponent implements OnInit, OnDestroy {
  protected project: Project | null = null;
  protected loading$: Observable<boolean>;
  private destroy$ = new Subject<void>();
  private projectId = '';

  protected readonly ArrowLeft = ArrowLeft;
  protected readonly MapPin = MapPin;
  protected readonly Calendar = Calendar;
  protected readonly Ruler = Ruler;
  protected readonly FileText = FileText;
  protected readonly Activity = Activity;

  constructor(
    private route: ActivatedRoute,
    private store: Store,
  ) {
    this.loading$ = this.store.select(selectProjectsLoading);
  }

  ngOnInit(): void {
    // Subscribe to the selected project from the store (set by the effect).
    this.store
      .select(selectSelectedProject)
      .pipe(takeUntil(this.destroy$))
      .subscribe((project) => {
        this.project = project;
      });

    // React to route param changes without requiring a full component
    // destroy/re-create cycle (e.g., navigating /projects/a → /projects/b).
    this.route.paramMap
      .pipe(
        map((params) => params.get('id') ?? ''),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe((id) => {
        this.projectId = id;
        if (id) {
          this.store.dispatch(ProjectsActions.loadProject({ id }));
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
