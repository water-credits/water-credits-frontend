import { Component, OnInit } from '@angular/core';
import {
  NgIf,
  NgFor,
  NgSwitch,
  NgSwitchCase,
  NgSwitchDefault,
  NgClass,
  DecimalPipe,
} from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  RefreshCw,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Gauge,
  Clock,
  Server,
  Filter,
} from 'lucide-angular';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { LoggingService } from '../../../core/services/logging.service';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import {
  DataTableComponent,
  ColumnDef,
  Pagination,
  SortEvent,
} from '../../../shared/components/data-table/data-table.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';
import {
  SensorChartComponent,
  ChartSeries,
} from '../../../shared/components/sensor-chart/sensor-chart';
import {
  OracleAnomaly,
  OracleNodeHealth,
  OracleSubmissionHistoryItem,
  OracleTimeseriesPoint,
} from '../../../core/models/oracle-metrics.model';
import { anomalyTypeLabel, severityRank } from '../../../core/services/oracle-metrics.mock';

type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-oracle-analytics',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    NgSwitch,
    NgSwitchCase,
    NgSwitchDefault,
    NgClass,
    DecimalPipe,
    FormsModule,
    LucideAngularModule,
    DateFormatPipe,
    DataTableComponent,
    StatusBadgeComponent,
    SensorChartComponent,
  ],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Oracle Analytics</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Submission history, node health, and uptime trends for your oracle nodes
          </p>
        </div>
        <button (click)="refresh()" class="btn btn-outline flex items-center gap-2">
          <lucide-angular [img]="RefreshCw" class="w-4 h-4"></lucide-angular>
          Refresh
        </button>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2">
          <lucide-angular [img]="Server" class="w-4 h-4 text-slate-400"></lucide-angular>
          <select
            [(ngModel)]="selectedNodeId"
            (ngModelChange)="onNodeChange()"
            class="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-bg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-stellar-blue/50"
          >
            <option [ngValue]="null">All nodes</option>
            <option *ngFor="let node of nodes" [ngValue]="node.nodeId">
              {{ node.nodeAddress }}
            </option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <lucide-angular [img]="Clock" class="w-4 h-4 text-slate-400"></lucide-angular>
          <select
            [(ngModel)]="rangeDays"
            (ngModelChange)="onRangeChange()"
            class="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-bg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-stellar-blue/50"
          >
            <option [ngValue]="7">Last 7 days</option>
            <option [ngValue]="30">Last 30 days</option>
            <option [ngValue]="90">Last 90 days</option>
          </select>
        </div>
      </div>

      <div *ngIf="loading" class="flex items-center justify-center py-12">
        <div
          class="animate-spin w-8 h-8 border-2 border-stellar-blue border-t-transparent rounded-full"
        ></div>
      </div>

      <ng-container *ngIf="!loading">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="card p-4">
            <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
              <lucide-angular [img]="Server" class="w-4 h-4"></lucide-angular> Nodes
            </div>
            <p class="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {{ onlineCount }}/{{ nodes.length }}
              <span class="text-sm font-normal text-slate-400">online</span>
            </p>
          </div>
          <div class="card p-4">
            <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
              <lucide-angular [img]="CheckCircle2" class="w-4 h-4"></lucide-angular> Avg success
              rate
            </div>
            <p class="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {{ avgSuccessRate | number: '1.1-1' }}%
            </p>
          </div>
          <div class="card p-4">
            <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
              <lucide-angular [img]="Gauge" class="w-4 h-4"></lucide-angular> Avg latency
            </div>
            <p class="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {{ avgLatency | number: '1.0-0' }}ms
            </p>
          </div>
          <div class="card p-4">
            <div class="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
              <lucide-angular [img]="AlertTriangle" class="w-4 h-4"></lucide-angular> Anomalies
            </div>
            <p class="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {{ anomalies.length }}
            </p>
          </div>
        </div>

        <div *ngIf="anomalies.length" class="card p-5">
          <h3
            class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2"
          >
            <lucide-angular [img]="AlertTriangle" class="w-4 h-4 text-amber-500"></lucide-angular>
            Anomaly alerts
          </h3>
          <div class="space-y-2">
            <div
              *ngFor="let anomaly of sortedAnomalies"
              class="flex items-start gap-3 p-3 rounded-lg border"
              [ngClass]="{
                'border-red-200 bg-red-50 dark:bg-red-900/20': anomaly.severity === 'critical',
                'border-amber-200 bg-amber-50 dark:bg-amber-900/20': anomaly.severity === 'warning',
                'border-slate-200 bg-slate-50 dark:bg-slate-800/40': anomaly.severity === 'info',
              }"
            >
              <lucide-angular
                [img]="anomaly.severity === 'critical' ? XCircle : AlertTriangle"
                class="w-5 h-5 mt-0.5 shrink-0"
                [ngClass]="{
                  'text-red-500': anomaly.severity === 'critical',
                  'text-amber-500': anomaly.severity === 'warning',
                  'text-slate-400': anomaly.severity === 'info',
                }"
              ></lucide-angular>
              <div class="flex-1">
                <p class="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {{ anomalyTypeLabel(anomaly.type) }} — {{ anomaly.nodeAddress }}
                </p>
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ anomaly.message }}</p>
              </div>
              <span class="text-xs text-slate-400">{{
                anomaly.detectedAt | dateFormat: 'relative'
              }}</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <app-sensor-chart
            [title]="'Submission volume'"
            [series]="submissionVolumeSeries"
          ></app-sensor-chart>
          <app-sensor-chart
            [title]="'Average latency (ms)'"
            [series]="latencySeries"
          ></app-sensor-chart>
          <app-sensor-chart [title]="'Uptime %'" [series]="uptimeSeries"></app-sensor-chart>
          <app-sensor-chart
            [title]="'Success rate %'"
            [series]="successRateSeries"
          ></app-sensor-chart>
        </div>

        <div class="card p-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Submission history
            </h3>
            <div class="flex items-center gap-2">
              <lucide-angular [img]="Filter" class="w-4 h-4 text-slate-400"></lucide-angular>
              <select
                [(ngModel)]="statusFilter"
                (ngModelChange)="onStatusChange()"
                class="px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-bg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-stellar-blue/50"
              >
                <option value="all">All statuses</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
          <app-data-table
            [columns]="submissionColumns"
            [data]="displayedSubmissions"
            [loading]="submissionsLoading"
            [pagination]="pagination"
            [sortColumn]="sortColumn"
            [sortDirection]="sortDirection"
            (sort)="onSort($event)"
            (page)="onPageChange($event)"
            emptyTitle="No submissions"
            emptyMessage="No submissions match the current filters."
          >
            <ng-template #row let-row let-col="column">
              <ng-container [ngSwitch]="col.key">
                <span *ngSwitchCase="'nodeAddress'">{{ row.nodeAddress }}</span>
                <span *ngSwitchCase="'status'">
                  <app-status-badge [status]="row.status"></app-status-badge>
                </span>
                <span *ngSwitchCase="'latencyMs'" class="text-right">{{ row.latencyMs }}ms</span>
                <span *ngSwitchCase="'createdAt'" class="text-right">{{
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
export class OracleAnalyticsComponent implements OnInit {
  protected loading = false;
  protected submissionsLoading = false;

  public nodes: OracleNodeHealth[] = [];
  public timeseries: OracleTimeseriesPoint[] = [];
  public submissions: OracleSubmissionHistoryItem[] = [];
  public anomalies: OracleAnomaly[] = [];

  public selectedNodeId: string | null = null;
  protected rangeDays = 30;
  public statusFilter: 'all' | 'success' | 'failed' = 'all';

  protected page = 1;
  protected limit = 10;
  protected totalPages = 1;
  protected total = 0;

  public sortColumn = 'createdAt';
  public sortDirection: SortDirection = 'desc';

  protected readonly RefreshCw = RefreshCw;
  protected readonly Server = Server;
  protected readonly Clock = Clock;
  protected readonly Activity = Activity;
  protected readonly AlertTriangle = AlertTriangle;
  protected readonly CheckCircle2 = CheckCircle2;
  protected readonly XCircle = XCircle;
  protected readonly Gauge = Gauge;
  protected readonly Filter = Filter;

  protected submissionColumns: ColumnDef<OracleSubmissionHistoryItem>[] = [
    { key: 'nodeAddress', label: 'Node', sortable: true },
    { key: 'projectId', label: 'Project', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'latencyMs', label: 'Latency', sortable: true, align: 'right' },
    { key: 'createdAt', label: 'Submitted', sortable: true, align: 'right' },
  ];

  constructor(
    private analytics: AnalyticsService,
    private logging: LoggingService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadAll();
  }

  anomalyTypeLabel = anomalyTypeLabel;

  get sortedAnomalies(): OracleAnomaly[] {
    return [...this.anomalies].sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
  }

  get onlineCount(): number {
    return this.nodes.filter((n) => n.status === 'online').length;
  }

  get avgSuccessRate(): number {
    if (!this.nodes.length) return 0;
    return this.nodes.reduce((sum, n) => sum + n.successRate, 0) / this.nodes.length;
  }

  get avgLatency(): number {
    if (!this.nodes.length) return 0;
    return this.nodes.reduce((sum, n) => sum + n.avgLatencyMs, 0) / this.nodes.length;
  }

  get pagination(): Pagination {
    return { page: this.page, totalPages: this.totalPages, total: this.total, limit: this.limit };
  }

  get submissionVolumeSeries(): ChartSeries[] {
    return [
      {
        label: 'Success',
        color: '#16A34A',
        data: this.timeseries.map((p) => ({ x: new Date(p.timestamp).getTime(), y: p.success })),
      },
      {
        label: 'Failed',
        color: '#DC2626',
        data: this.timeseries.map((p) => ({ x: new Date(p.timestamp).getTime(), y: p.failed })),
      },
    ];
  }

  get latencySeries(): ChartSeries[] {
    return [
      {
        label: 'Latency (ms)',
        color: '#7C3AED',
        data: this.timeseries.map((p) => ({ x: new Date(p.timestamp).getTime(), y: p.latencyMs })),
      },
    ];
  }

  get uptimeSeries(): ChartSeries[] {
    return [
      {
        label: 'Uptime %',
        color: '#0EA5E9',
        data: this.timeseries.map((p) => ({ x: new Date(p.timestamp).getTime(), y: p.uptimePct })),
      },
    ];
  }

  get successRateSeries(): ChartSeries[] {
    return [
      {
        label: 'Success rate %',
        color: '#16A34A',
        data: this.timeseries.map((p) => ({
          x: new Date(p.timestamp).getTime(),
          y: p.success + p.failed ? (p.success / (p.success + p.failed)) * 100 : 0,
        })),
      },
    ];
  }

  get displayedSubmissions(): OracleSubmissionHistoryItem[] {
    const dir = this.sortDirection === 'asc' ? 1 : -1;
    const col = this.sortColumn;
    return [...this.submissions].sort((a, b) => {
      const av = (a as unknown as Record<string, unknown>)[col];
      const bv = (b as unknown as Record<string, unknown>)[col];
      if (av == null && bv == null) return 0;
      if (av == null) return -1 * dir;
      if (bv == null) return 1 * dir;
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }

  async refresh(): Promise<void> {
    this.loading = true;
    this.submissionsLoading = true;
    await this.loadAll();
    this.loading = false;
    this.submissionsLoading = false;
  }

  async onNodeChange(): Promise<void> {
    this.page = 1;
    await Promise.all([this.loadTimeseries(), this.loadSubmissions(), this.loadAnomalies()]);
  }

  async onRangeChange(): Promise<void> {
    await this.loadTimeseries();
  }

  async onStatusChange(): Promise<void> {
    this.page = 1;
    await this.loadSubmissions();
  }

  async onPageChange(page: number): Promise<void> {
    this.page = page;
    await this.loadSubmissions();
  }

  onSort(event: SortEvent): void {
    this.sortColumn = event.column;
    this.sortDirection = event.direction;
  }

  private async loadAll(): Promise<void> {
    await Promise.all([
      this.loadNodes(),
      this.loadTimeseries(),
      this.loadSubmissions(),
      this.loadAnomalies(),
    ]);
  }

  private async loadNodes(): Promise<void> {
    try {
      this.nodes = await this.analytics.getOracleNodes();
    } catch (error) {
      this.logging.error('Failed to load oracle nodes:', error);
      this.nodes = [];
    }
  }

  private async loadTimeseries(): Promise<void> {
    try {
      this.timeseries = await this.analytics.getOracleTimeseries(
        this.rangeDays,
        this.selectedNodeId ?? undefined,
      );
    } catch (error) {
      this.logging.error('Failed to load oracle timeseries:', error);
      this.timeseries = [];
    }
  }

  private async loadSubmissions(): Promise<void> {
    try {
      const res = await this.analytics.getOracleSubmissions({
        page: this.page,
        limit: this.limit,
        nodeId: this.selectedNodeId ?? undefined,
        status: this.statusFilter === 'all' ? undefined : this.statusFilter,
      });
      this.submissions = res.data;
      this.page = res.page;
      this.totalPages = res.totalPages;
      this.total = res.total;
    } catch (error) {
      this.logging.error('Failed to load oracle submissions:', error);
      this.submissions = [];
    }
  }

  private async loadAnomalies(): Promise<void> {
    try {
      this.anomalies = await this.analytics.getOracleAnomalies(this.selectedNodeId ?? undefined);
    } catch (error) {
      this.logging.error('Failed to load oracle anomalies:', error);
      this.anomalies = [];
    }
  }
}
