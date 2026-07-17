import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor, NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { OracleService } from '../../../core/services/oracle.service';
import { NumberAbbreviatePipe } from '../../../shared/pipes/number-abbreviate.pipe';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import { StellarAddressPipe } from '../../../shared/pipes/stellar-address.pipe';
import { DataTableComponent, ColumnDef } from '../../../shared/components/data-table/data-table';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';
import { AnalyticsOverview } from '../../../core/models/analytics.model';
import { OracleSubmission } from '../../../core/models/oracle.model';
import {
  LucideAngularModule,
  Users,
  Building2,
  HardDrive,
  RefreshCw,
  Activity,
  ArrowRight,
  Clock,
  ShieldCheck,
  Settings,
} from 'lucide-angular';
import { LoggingService } from '../../../core/services/logging.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    NgSwitch,
    NgSwitchCase,
    NgSwitchDefault,
    RouterLink,
    NumberAbbreviatePipe,
    DateFormatPipe,
    StellarAddressPipe,
    DataTableComponent,
    StatusBadgeComponent,
    LucideAngularModule,
  ],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            System overview and management
          </p>
        </div>
      </div>

      <div *ngIf="loading" class="flex items-center justify-center py-20">
        <div
          class="animate-spin w-8 h-8 border-2 border-stellar-blue border-t-transparent rounded-full"
        ></div>
      </div>

      <ng-container *ngIf="!loading">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="card p-5">
            <div class="flex items-center justify-between mb-3">
              <p
                class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"
              >
                Total Users
              </p>
              <div class="w-9 h-9 rounded-lg bg-stellar-blue/10 flex items-center justify-center">
                <lucide-angular
                  [img]="UsersIcon"
                  class="w-4 h-4 text-stellar-blue"
                ></lucide-angular>
              </div>
            </div>
            <p class="text-2xl font-bold text-slate-900 dark:text-white">
              {{ overview?.totalUsers ?? 0 | numberAbbreviate }}
            </p>
          </div>

          <div class="card p-5">
            <div class="flex items-center justify-between mb-3">
              <p
                class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"
              >
                Total Projects
              </p>
              <div
                class="w-9 h-9 rounded-lg bg-environmental-green/10 flex items-center justify-center"
              >
                <lucide-angular
                  [img]="Building2"
                  class="w-4 h-4 text-environmental-green"
                ></lucide-angular>
              </div>
            </div>
            <p class="text-2xl font-bold text-slate-900 dark:text-white">
              {{ overview?.totalProjects ?? 0 | numberAbbreviate }}
            </p>
            <p class="text-xs text-green-600 mt-1">{{ overview?.activeProjects ?? 0 }} active</p>
          </div>

          <div class="card p-5">
            <div class="flex items-center justify-between mb-3">
              <p
                class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"
              >
                Oracles
              </p>
              <div class="w-9 h-9 rounded-lg bg-credit-gold/10 flex items-center justify-center">
                <lucide-angular
                  [img]="ShieldCheck"
                  class="w-4 h-4 text-credit-gold"
                ></lucide-angular>
              </div>
            </div>
            <p class="text-2xl font-bold text-slate-900 dark:text-white">
              {{ overview?.verifiedOracles ?? 0 | numberAbbreviate }}
            </p>
          </div>

          <div class="card p-5">
            <div class="flex items-center justify-between mb-3">
              <p
                class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"
              >
                Retirements
              </p>
              <div class="w-9 h-9 rounded-lg bg-retirement-red/10 flex items-center justify-center">
                <lucide-angular
                  [img]="RefreshCw"
                  class="w-4 h-4 text-retirement-red"
                ></lucide-angular>
              </div>
            </div>
            <p class="text-2xl font-bold text-slate-900 dark:text-white">
              {{ overview?.totalRetirements ?? 0 | numberAbbreviate }}
            </p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="card p-5">
            <h3
              class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2"
            >
              <lucide-angular [img]="Clock" class="w-4 h-4 text-slate-400"></lucide-angular>
              Queue Depths
            </h3>
            <div class="space-y-3">
              <div
                class="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700"
              >
                <span class="text-sm text-slate-600 dark:text-slate-400">Pending Submissions</span>
                <span class="text-sm font-semibold text-yellow-600 dark:text-yellow-400">{{
                  queueDepths.pendingSubmissions
                }}</span>
              </div>
              <div
                class="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700"
              >
                <span class="text-sm text-slate-600 dark:text-slate-400">Active Retirements</span>
                <span class="text-sm font-semibold text-stellar-blue">{{
                  queueDepths.activeRetirements
                }}</span>
              </div>
              <div class="flex items-center justify-between py-2">
                <span class="text-sm text-slate-600 dark:text-slate-400"
                  >Pending Verifications</span
                >
                <span class="text-sm font-semibold text-environmental-green">{{
                  queueDepths.pendingVerifications
                }}</span>
              </div>
            </div>
          </div>

          <div class="card p-5">
            <h3
              class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2"
            >
              <lucide-angular [img]="Activity" class="w-4 h-4 text-slate-400"></lucide-angular>
              Quick Links
            </h3>
            <div class="space-y-2">
              <a
                routerLink="/admin/oracles"
                class="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
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
                      Oracle Management
                    </p>
                    <p class="text-xs text-slate-400">Manage oracle nodes and submissions</p>
                  </div>
                </div>
                <lucide-angular
                  [img]="ArrowRight"
                  class="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors"
                ></lucide-angular>
              </a>
              <a
                routerLink="/admin/fees"
                class="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-lg bg-stellar-blue/10 flex items-center justify-center"
                  >
                    <lucide-angular
                      [img]="Settings"
                      class="w-4 h-4 text-stellar-blue"
                    ></lucide-angular>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Fees & Parameters
                    </p>
                    <p class="text-xs text-slate-400">Configure protocol fees and thresholds</p>
                  </div>
                </div>
                <lucide-angular
                  [img]="ArrowRight"
                  class="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors"
                ></lucide-angular>
              </a>
              <a
                routerLink="/admin/users"
                class="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-8 h-8 rounded-lg bg-environmental-green/10 flex items-center justify-center"
                  >
                    <lucide-angular
                      [img]="UsersIcon"
                      class="w-4 h-4 text-environmental-green"
                    ></lucide-angular>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-slate-700 dark:text-slate-300">
                      User Management
                    </p>
                    <p class="text-xs text-slate-400">Manage users, roles, and KYC status</p>
                  </div>
                </div>
                <lucide-angular
                  [img]="ArrowRight"
                  class="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors"
                ></lucide-angular>
              </a>
            </div>
          </div>
        </div>

        <div class="card p-5">
          <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
            Recent Submissions
          </h3>
          <app-data-table
            [columns]="submissionColumns"
            [data]="recentSubmissions"
            [loading]="submissionsLoading"
            [showPagination]="false"
            emptyTitle="No submissions yet"
            emptyMessage="Oracle submissions will appear here once they start flowing."
          >
            <ng-template #row let-row let-col="column">
              <ng-container [ngSwitch]="col.key">
                <span *ngSwitchCase="'status'">
                  <app-status-badge [status]="row.status"></app-status-badge>
                </span>
                <span *ngSwitchCase="'oracleAddress'">{{
                  row.oracleAddress | stellarAddress
                }}</span>
                <span *ngSwitchCase="'createdAt'">{{
                  row.createdAt | dateFormat: 'relative'
                }}</span>
                <span *ngSwitchDefault>{{ row[col.key] }}</span>
              </ng-container>
            </ng-template>
          </app-data-table>
        </div>
      </ng-container>
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  protected loading = true;
  protected submissionsLoading = false;
  protected overview: AnalyticsOverview | null = null;
  protected recentSubmissions: OracleSubmission[] = [];

  protected queueDepths = {
    pendingSubmissions: 3,
    activeRetirements: 1,
    pendingVerifications: 5,
  };

  protected readonly UsersIcon = Users;
  protected readonly Building2 = Building2;
  protected readonly HardDrive = HardDrive;
  protected readonly RefreshCw = RefreshCw;
  protected readonly Activity = Activity;
  protected readonly ArrowRight = ArrowRight;
  protected readonly Clock = Clock;
  protected readonly ShieldCheck = ShieldCheck;
  protected readonly Settings = Settings;

  protected submissionColumns: ColumnDef[] = [
    { key: 'projectId', label: 'Project ID' },
    { key: 'oracleAddress', label: 'Oracle' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Submitted', align: 'right' },
  ];

  constructor(
    private analyticsService: AnalyticsService,
    private oracleService: OracleService,
    private loggingService: LoggingService,
  ) {}

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadOverview(), this.loadSubmissions()]);
    this.loading = false;
  }

  private async loadOverview(): Promise<void> {
    try {
      this.overview = await this.analyticsService.getOverview();
    } catch (error) {
      this.loggingService.error('Failed to load analytics overview:', error);
    }
  }

  private async loadSubmissions(): Promise<void> {
    try {
      this.submissionsLoading = true;
      const res = await this.oracleService.getSubmissions({ limit: 5 });
      this.recentSubmissions = res.data;
    } catch (error) {
      this.loggingService.error('Failed to load submissions:', error);
    } finally {
      this.submissionsLoading = false;
    }
  }
}
