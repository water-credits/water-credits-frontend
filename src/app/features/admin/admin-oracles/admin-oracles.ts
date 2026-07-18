import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor, NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OracleService } from '../../../core/services/oracle.service';
import { NotificationService } from '../../../core/services/notification.service';
import { StellarAddressPipe } from '../../../shared/pipes/stellar-address.pipe';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import {
  DataTableComponent,
  ColumnDef,
} from '../../../shared/components/data-table/data-table.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { OracleSubmission } from '../../../core/models/oracle.model';
import { LucideAngularModule, Plus, Trash2, HardDrive, RefreshCw } from 'lucide-angular';
import { LoggingService } from '../../../core/services/logging.service';

interface OracleEntry {
  address: string;
  status: string;
  lastSubmission: string;
  latestSubmission: OracleSubmission | null;
}

@Component({
  selector: 'app-admin-oracles',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    NgSwitch,
    NgSwitchCase,
    NgSwitchDefault,
    FormsModule,
    StellarAddressPipe,
    DateFormatPipe,
    DataTableComponent,
    StatusBadgeComponent,
    ConfirmDialogComponent,
    LucideAngularModule,
  ],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Oracle Management</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage oracle nodes and monitor submissions
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="refresh()" class="btn btn-outline flex items-center gap-2">
            <lucide-angular [img]="RefreshCw" class="w-4 h-4"></lucide-angular>
            Refresh
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
          <div class="card p-5">
            <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
              Registered Oracles
            </h3>
            <div *ngIf="loading" class="flex items-center justify-center py-12">
              <div
                class="animate-spin w-8 h-8 border-2 border-stellar-blue border-t-transparent rounded-full"
              ></div>
            </div>
            <ng-container *ngIf="!loading">
              <div *ngIf="oracles.length === 0" class="text-center py-12">
                <lucide-angular
                  [img]="HardDrive"
                  class="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3"
                ></lucide-angular>
                <p class="text-sm text-slate-500 dark:text-slate-400">No oracles registered yet</p>
              </div>
              <div
                *ngFor="let oracle of oracles; let i = index"
                class="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700 last:border-0"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-lg bg-credit-gold/10 flex items-center justify-center"
                  >
                    <lucide-angular
                      [img]="HardDrive"
                      class="w-4 h-4 text-credit-gold"
                    ></lucide-angular>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {{ oracle.address | stellarAddress: 8 }}
                    </p>
                    <p class="text-xs text-slate-400">
                      Last: {{ oracle.lastSubmission | dateFormat: 'relative' }}
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-3">
                  <app-status-badge [status]="oracle.status"></app-status-badge>
                  <button
                    (click)="confirmRemove(oracle)"
                    class="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <lucide-angular [img]="Trash2" class="w-4 h-4"></lucide-angular>
                  </button>
                </div>
              </div>
            </ng-container>
          </div>
        </div>

        <div>
          <div class="card p-5">
            <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
              Add Oracle
            </h3>
            <div class="space-y-3">
              <input
                [(ngModel)]="newOracleAddress"
                placeholder="G... or oracle address"
                class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-bg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-stellar-blue/50"
              />
              <button
                (click)="addOracle()"
                [disabled]="!newOracleAddress.trim()"
                class="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                <lucide-angular [img]="Plus" class="w-4 h-4"></lucide-angular>
                Add Oracle
              </button>
            </div>
          </div>

          <div class="card p-5 mt-6">
            <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Stats</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-slate-500 dark:text-slate-400">Total Oracles</span>
                <span class="font-semibold text-slate-700 dark:text-slate-300">{{
                  oracles.length
                }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500 dark:text-slate-400">Confirmed</span>
                <span class="font-semibold text-green-600">{{ confirmedCount }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500 dark:text-slate-400">Pending</span>
                <span class="font-semibold text-yellow-600">{{ pendingCount }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500 dark:text-slate-400">Failed</span>
                <span class="font-semibold text-red-600">{{ failedCount }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card p-5">
        <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
          Submission History
        </h3>
        <app-data-table
          [columns]="submissionColumns"
          [data]="submissions"
          [loading]="submissionsLoading"
          [pagination]="pagination"
          [totalPages]="pagination?.totalPages ?? 1"
          [total]="pagination?.total ?? 0"
          [limit]="pagination?.limit ?? 10"
          (page)="onPageChange($event)"
          emptyTitle="No submissions"
          emptyMessage="Oracle submissions will appear here."
        >
          <ng-template #row let-row let-col="column">
            <ng-container [ngSwitch]="col.key">
              <span *ngSwitchCase="'oracleAddress'">{{ row.oracleAddress | stellarAddress }}</span>
              <span *ngSwitchCase="'status'">
                <app-status-badge [status]="row.status"></app-status-badge>
              </span>
              <span *ngSwitchCase="'createdAt'">{{ row.createdAt | dateFormat: 'relative' }}</span>
              <span *ngSwitchDefault>{{ row[col.key] }}</span>
            </ng-container>
          </ng-template>
        </app-data-table>
      </div>
    </div>

    <app-confirm-dialog
      *ngIf="showRemoveDialog"
      title="Remove Oracle"
      [message]="
        'Are you sure you want to remove oracle ' +
        (oracleToRemove?.address ?? '' | stellarAddress) +
        '?'
      "
      confirmLabel="Remove"
      confirmVariant="danger"
      (confirm)="removeOracle()"
      (cancel)="showRemoveDialog = false"
    />
  `,
})
export class AdminOraclesComponent implements OnInit {
  protected loading = true;
  protected submissionsLoading = false;
  protected oracles: OracleEntry[] = [];
  protected submissions: OracleSubmission[] = [];
  protected newOracleAddress = '';
  protected showRemoveDialog = false;
  protected oracleToRemove: OracleEntry | null = null;
  protected page = 1;
  protected totalPages = 1;
  protected total = 0;
  protected limit = 10;

  protected readonly HardDrive = HardDrive;
  protected readonly Plus = Plus;
  protected readonly Trash2 = Trash2;
  protected readonly RefreshCw = RefreshCw;

  protected submissionColumns: ColumnDef[] = [
    { key: 'projectId', label: 'Project ID' },
    { key: 'oracleAddress', label: 'Oracle', width: '25%' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Submitted', align: 'right' },
  ];

  constructor(
    private oracleService: OracleService,
    private notification: NotificationService,
    private loggingService: LoggingService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadData();
  }

  get confirmedCount(): number {
    return this.oracles.filter((o) => o.status === 'confirmed').length;
  }

  get pendingCount(): number {
    return this.oracles.filter((o) => o.status === 'pending').length;
  }

  get failedCount(): number {
    return this.oracles.filter((o) => o.status === 'failed').length;
  }

  async refresh(): Promise<void> {
    await this.loadData();
  }

  async addOracle(): Promise<void> {
    const address = this.newOracleAddress.trim();
    if (!address) return;
    this.notification.success(
      'Oracle Added',
      `Oracle ${address.substring(0, 8)}... has been registered.`,
    );
    this.newOracleAddress = '';
    await this.loadData();
  }

  confirmRemove(oracle: OracleEntry): void {
    this.oracleToRemove = oracle;
    this.showRemoveDialog = true;
  }

  async removeOracle(): Promise<void> {
    if (!this.oracleToRemove) return;
    this.notification.success(
      'Oracle Removed',
      `Oracle ${this.oracleToRemove.address.substring(0, 8)}... has been removed.`,
    );
    this.showRemoveDialog = false;
    this.oracleToRemove = null;
    await this.loadData();
  }

  async onPageChange(page: number): Promise<void> {
    this.page = page;
    await this.loadSubmissions();
  }

  private async loadData(): Promise<void> {
    await Promise.all([this.loadSubmissions(), this.buildOracleList()]);
    this.loading = false;
  }

  private async loadSubmissions(): Promise<void> {
    try {
      this.submissionsLoading = true;
      const res = await this.oracleService.getSubmissions({ page: this.page, limit: this.limit });
      this.submissions = res.data;
      this.page = res.page;
      this.totalPages = res.totalPages;
      this.total = res.total;
    } catch (error) {
      this.loggingService.error('Failed to load submissions:', error);
    } finally {
      this.submissionsLoading = false;
    }
  }

  private async buildOracleList(): Promise<void> {
    try {
      const res = await this.oracleService.getSubmissions({ limit: 100 });
      const grouped = new Map<string, OracleSubmission[]>();
      for (const sub of res.data) {
        const existing = grouped.get(sub.oracleAddress) || [];
        existing.push(sub);
        grouped.set(sub.oracleAddress, existing);
      }
      this.oracles = Array.from(grouped.entries()).map(([address, subs]) => {
        subs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const latest = subs[0];
        return {
          address,
          status: latest.status,
          lastSubmission: latest.createdAt,
          latestSubmission: latest,
        };
      });
    } catch (error) {
      this.loggingService.error('Failed to build oracle list:', error);
      this.oracles = [];
    }
  }
}
