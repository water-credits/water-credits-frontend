import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { AsyncPipe, NgIf, NgSwitch, NgSwitchCase } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Plus, FileText, Download } from 'lucide-angular';
import { Store } from '@ngrx/store';
import { Observable, combineLatest, map, take, firstValueFrom } from 'rxjs';

import { Retirement, EsgReportOptions } from '../../../core/models/retirement.model';
import { Pagination } from '../../../shared/components/data-table/column-def.model';
import * as RetirementActions from '../../../core/store/retirement/retirement.actions';
import {
  selectRetirements,
  selectRetirementLoading,
  selectRetirementError,
  selectRetirementPagination,
  selectRetirementLastFetched,
} from '../../../core/store/retirement/retirement.selectors';
import {
  DataTableComponent,
  ColumnDef,
} from '../../../shared/components/data-table/data-table.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';
import { LoadingStateComponent } from '../../../shared/components/loading-state/loading-state';
import { CreditAmountPipe } from '../../../shared/pipes/credit-amount.pipe';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import { EsgReportService } from '../../../core/services/esg-report.service';

/**
 * Page limit sent with every loadRetirements dispatch.
 * Must be kept in sync with selectRetirementPagination's limit field.
 * The CacheInvalidationEffects also uses this constant so all callers agree.
 */
export const RETIREMENT_PAGE_LIMIT = 10;

/**
 * Maximum age (ms) of a cached retirement list before a fresh dispatch is
 * required on ngOnInit. Navigation back to this page within the TTL window
 * reuses the cached slice without an extra round-trip.
 * Cache-invalidation via retirementConfirmed always bypasses this guard.
 */
const RETIREMENT_CACHE_TTL_MS = 60_000; // 60 seconds

@Component({
  selector: 'app-retirement-history',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    NgIf,
    NgSwitch,
    NgSwitchCase,
    RouterLink,
    LucideAngularModule,
    DataTableComponent,
    StatusBadgeComponent,
    LoadingStateComponent,
    CreditAmountPipe,
    DateFormatPipe,
  ],
  template: `
    <div class="max-w-6xl mx-auto">
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Retirement History</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            View all your retired carbon credits and download certificates.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <button
            *ngIf="!isGeneratingReport"
            (click)="onGenerateEsgReport()"
            class="btn btn-secondary flex items-center gap-2"
            [disabled]="!(retirements$ | async)?.length"
          >
            <lucide-angular [img]="DownloadIcon" class="w-4 h-4"></lucide-angular>
            ESG Report
          </button>
          <button
            *ngIf="isGeneratingReport"
            class="btn btn-secondary flex items-center gap-2 opacity-75 cursor-not-allowed"
            disabled
          >
            <svg
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
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Generating...
          </button>
          <a routerLink="/retirement/new" class="btn btn-primary flex items-center gap-2">
            <lucide-angular [img]="PlusIcon" class="w-4 h-4"></lucide-angular>
            New Retirement
          </a>
        </div>
      </div>

      <app-loading-state
        [loading]="(loading$ | async) ?? false"
        [error]="(error$ | async) ?? null"
        [empty]="(isEmpty$ | async) ?? false"
        emptyTitle="No retirements yet"
        emptyMessage="Retire credits to see your history here."
        skeleton="table"
        [skeletonRows]="RETIREMENT_PAGE_LIMIT"
        (retry)="onRetry()"
      >
        <app-data-table
          [columns]="columns"
          [data]="(retirements$ | async) ?? []"
          [loading]="false"
          [pagination]="(pagination$ | async) ?? null"
          (page)="onPageChange($event)"
        >
          <ng-template #row let-row let-col="column">
            <ng-container [ngSwitch]="col.key">
              <span *ngSwitchCase="'projectName'">
                {{ row.projectName || row.projectId }}
              </span>
              <span *ngSwitchCase="'amount'">
                {{ row.amount | creditAmount }}
              </span>
              <span *ngSwitchCase="'purpose'" class="max-w-[200px] truncate block">
                {{ row.purpose }}
              </span>
              <span *ngSwitchCase="'status'">
                <app-status-badge [status]="row.status"></app-status-badge>
              </span>
              <span *ngSwitchCase="'retiredAt'" class="whitespace-nowrap">
                {{ row.retiredAt | dateFormat }}
              </span>
              <span *ngSwitchCase="'certificate'">
                <a
                  *ngIf="row.status === 'confirmed'"
                  [routerLink]="['/retirement', row.id, 'certificate']"
                  class="text-stellar-blue hover:text-stellar-blue-light inline-flex items-center gap-1 text-sm"
                >
                  <lucide-angular [img]="FileTextIcon" class="w-4 h-4"></lucide-angular>
                  Certificate
                </a>
                <span *ngIf="row.status !== 'confirmed'" class="text-slate-400 text-sm">—</span>
              </span>
            </ng-container>
          </ng-template>
        </app-data-table>
      </app-loading-state>
    </div>
  `,
})
export class RetirementHistoryComponent implements OnInit {
  protected readonly retirements$: Observable<Retirement[]>;
  protected readonly loading$: Observable<boolean>;
  protected readonly error$: Observable<string | null>;
  protected readonly pagination$: Observable<Pagination>;
  protected readonly isEmpty$: Observable<boolean>;

  protected readonly RETIREMENT_PAGE_LIMIT = RETIREMENT_PAGE_LIMIT;

  protected readonly PlusIcon = Plus;
  protected readonly FileTextIcon = FileText;
  protected readonly DownloadIcon = Download;

  protected isGeneratingReport = false;

  protected readonly columns: ColumnDef<Retirement>[] = [
    { key: 'projectName', label: 'Project', width: '25%' },
    { key: 'amount', label: 'Amount' },
    { key: 'purpose', label: 'Purpose' },
    { key: 'status', label: 'Status' },
    { key: 'retiredAt', label: 'Date' },
    { key: 'certificate', label: 'Certificate' },
  ];

  constructor(
    private readonly store: Store,
    private readonly esgReportService: EsgReportService,
  ) {
    this.retirements$ = this.store.select(selectRetirements);
    this.loading$ = this.store.select(selectRetirementLoading);
    this.error$ = this.store.select(selectRetirementError);
    this.pagination$ = this.store.select(selectRetirementPagination);
    this.isEmpty$ = combineLatest([this.retirements$, this.loading$, this.error$]).pipe(
      map(([retirements, loading, error]) => !loading && !error && retirements.length === 0),
    );
  }

  ngOnInit(): void {
    // Read lastFetched once (no subscription kept) to decide whether the
    // cached slice is fresh enough to reuse. The CacheInvalidationEffects
    // handles forced refreshes after retirementConfirmed — it always
    // dispatches loadRetirements regardless of this guard.
    this.store
      .select(selectRetirementLastFetched)
      .pipe(take(1))
      .subscribe((lastFetched) => {
        const cacheAge = lastFetched ? Date.now() - lastFetched : Infinity;
        if (cacheAge > RETIREMENT_CACHE_TTL_MS) {
          this.store.dispatch(
            RetirementActions.loadRetirements({ page: 1, limit: RETIREMENT_PAGE_LIMIT }),
          );
        }
      });
  }

  protected onPageChange(page: number): void {
    this.store.dispatch(RetirementActions.loadRetirements({ page, limit: RETIREMENT_PAGE_LIMIT }));
  }

  protected onRetry(): void {
    this.store.dispatch(
      RetirementActions.loadRetirements({ page: 1, limit: RETIREMENT_PAGE_LIMIT }),
    );
  }

  protected async onGenerateEsgReport(): Promise<void> {
    if (this.isGeneratingReport) return;

    this.isGeneratingReport = true;

    try {
      const retirements = await firstValueFrom(this.retirements$);
      if (!retirements || retirements.length === 0) {
        return;
      }

      const confirmedRetirements = retirements.filter((r) => r.status === 'confirmed');
      if (confirmedRetirements.length === 0) {
        return;
      }

      const dates = confirmedRetirements.map((r) => new Date(r.retiredAt).getTime());
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));

      const options: EsgReportOptions = {
        userAddress: confirmedRetirements[0].userId,
        startDate: minDate,
        endDate: maxDate,
      };

      await this.esgReportService.generateReport(confirmedRetirements, options);
    } catch (error) {
      console.error('Failed to generate ESG report:', error);
    } finally {
      this.isGeneratingReport = false;
    }
  }
}
