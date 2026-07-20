import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgIf, NgFor, SlicePipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';
import { CreditAmountPipe } from '../../../shared/pipes/credit-amount.pipe';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { WebsocketService } from '../../../core/services/websocket.service';
import { AnalyticsOverview, CreditsOverTimePoint } from '../../../core/models/analytics.model';
import { RecentRetirement } from '../../../core/models/retirement.model';
import { SensorChartComponent } from '../../../shared/components/sensor-chart/sensor-chart';
import { SensorParameter, TimeRange } from '../../../shared/components/sensor-chart/sensor-parameter.model';
import { SensorReading } from '../../../core/models/sensor-reading.model';
import { selectRecentReadings } from '../../../core/store/sensors/sensors.selectors';
import {
  LucideAngularModule,
  Droplets,
  Leaf,
  Coins,
  TrendingUp,
  Activity,
  AlertTriangle,
} from 'lucide-angular';
import { LoggingService } from '../../../core/services/logging.service';

/** Parameters shown in the sensor summary widget on the main dashboard */
const SENSOR_SUMMARY_PARAMS: SensorParameter[] = [
  { key: 'ph', label: 'pH', unit: '', color: '#7B2FBE', decimals: 2 },
  { key: 'turbidity', label: 'Turbidity', unit: 'NTU', color: '#F59E0B', decimals: 1 },
  { key: 'dissolvedOxygen', label: 'Dissolved O₂', unit: 'mg/L', color: '#3B82F6', decimals: 1 },
];

const SENSOR_THRESHOLDS: Record<string, { low?: number; high?: number }> = {
  ph: { low: 6.5, high: 8.5 },
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    SlicePipe,
    CreditAmountPipe,
    DateFormatPipe,
    LucideAngularModule,
    SensorChartComponent,
  ],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Overview of the Water Credits platform
          </p>
        </div>
        <div class="flex items-center gap-2">
          <span
            class="w-2 h-2 rounded-full"
            [class]="wsConnected ? 'bg-green-500' : 'bg-red-500'"
          ></span>
          <span class="text-xs text-slate-400">{{ wsConnected ? 'Live' : 'Disconnected' }}</span>
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
                Total Projects
              </p>
              <div class="w-9 h-9 rounded-lg bg-stellar-blue/10 flex items-center justify-center">
                <lucide-angular [img]="Leaf" class="w-4 h-4 text-stellar-blue"></lucide-angular>
              </div>
            </div>
            <p class="text-2xl font-bold text-slate-900 dark:text-white">
              {{ overview?.totalProjects || 0 }}
            </p>
            <p class="text-xs text-green-600 mt-1">{{ overview?.activeProjects || 0 }} active</p>
          </div>

          <div class="card p-5">
            <div class="flex items-center justify-between mb-3">
              <p
                class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"
              >
                Credits Minted
              </p>
              <div
                class="w-9 h-9 rounded-lg bg-environmental-green/10 flex items-center justify-center"
              >
                <lucide-angular
                  [img]="Coins"
                  class="w-4 h-4 text-environmental-green"
                ></lucide-angular>
              </div>
            </div>
            <p class="text-2xl font-bold text-slate-900 dark:text-white">
              {{ overview?.totalCreditsMinted || '0' | creditAmount }}
            </p>
          </div>

          <div class="card p-5">
            <div class="flex items-center justify-between mb-3">
              <p
                class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"
              >
                Credits Retired
              </p>
              <div class="w-9 h-9 rounded-lg bg-credit-gold/10 flex items-center justify-center">
                <lucide-angular
                  [img]="TrendingUp"
                  class="w-4 h-4 text-credit-gold"
                ></lucide-angular>
              </div>
            </div>
            <p class="text-2xl font-bold text-slate-900 dark:text-white">
              {{ overview?.totalCreditsRetired || '0' | creditAmount }}
            </p>
            <p class="text-xs text-slate-400 mt-1">
              {{ overview?.totalRetirements || 0 }} retirements
            </p>
          </div>

          <div class="card p-5">
            <div class="flex items-center justify-between mb-3">
              <p
                class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider"
              >
                Network
              </p>
              <div class="w-9 h-9 rounded-lg bg-retirement-red/10 flex items-center justify-center">
                <lucide-angular
                  [img]="Activity"
                  class="w-4 h-4 text-retirement-red"
                ></lucide-angular>
              </div>
            </div>
            <p class="text-2xl font-bold text-slate-900 dark:text-white">
              {{ overview?.totalUsers || 0 }}
            </p>
            <p class="text-xs text-slate-400 mt-1">{{ overview?.verifiedOracles || 0 }} oracles</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="card p-5">
            <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
              Recent Retirements
            </h3>
            <div
              *ngIf="recentRetirements.length === 0"
              class="text-center py-8 text-sm text-slate-400"
            >
              No retirements yet
            </div>
            <div
              *ngFor="let r of recentRetirements"
              class="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0"
            >
              <div>
                <p class="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {{ r.projectName }}
                </p>
                <p class="text-xs text-slate-400">{{ r.retiredAt | dateFormat: 'relative' }}</p>
              </div>
              <span class="text-sm font-semibold text-environmental-green">{{
                r.amount | creditAmount
              }}</span>
            </div>
          </div>

          <div class="card p-5">
            <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
              Sensor Alerts
            </h3>
            <div class="text-center py-8 text-sm text-slate-400">
              <lucide-angular
                [img]="AlertTriangle"
                class="w-8 h-8 mx-auto mb-2 text-credit-gold"
              ></lucide-angular>
              No active alerts
            </div>
          </div>
        </div>

        <!-- Sensor Summary Widget -->
        <app-sensor-chart
          title="Water Quality Summary"
          [data]="latestSensorReadings"
          [parameters]="sensorSummaryParams"
          [timeRange]="sensorTimeRange"
          [thresholds]="sensorThresholds"
          (rangeChange)="onSensorRangeChange($event)"
          [height]="260"
        />

        <div class="card p-5">
          <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
            Credits Over Time
          </h3>
          <div *ngIf="creditsOverTime.length === 0" class="text-center py-8 text-sm text-slate-400">
            No data available yet
          </div>
          <div *ngIf="creditsOverTime.length > 0" class="h-64 flex items-end gap-1">
            <div
              *ngFor="let point of creditsOverTime"
              class="flex-1 flex flex-col items-center gap-1"
            >
              <div class="w-full flex gap-0.5">
                <div
                  [style.height.px]="getMintedHeight(point.minted)"
                  class="flex-1 bg-stellar-blue/60 rounded-t transition-all"
                ></div>
                <div
                  [style.height.px]="getRetiredHeight(point.retired)"
                  class="flex-1 bg-environmental-green/60 rounded-t transition-all"
                ></div>
              </div>
              <span class="text-[10px] text-slate-400 -rotate-45 origin-left truncate w-8">{{
                point.date | slice: 5 : 10
              }}</span>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
})
export class DashboardComponent implements OnInit, OnDestroy {
  protected loading = true;
  protected overview: AnalyticsOverview | null = null;
  protected creditsOverTime: CreditsOverTimePoint[] = [];
  protected recentRetirements: RecentRetirement[] = [];
  protected wsConnected = false;
  protected latestSensorReadings: SensorReading[] = [];
  protected sensorSummaryParams = SENSOR_SUMMARY_PARAMS;
  protected sensorThresholds = SENSOR_THRESHOLDS;
  protected sensorTimeRange: TimeRange = '24h';
  private destroy$ = new Subject<void>();

  protected readonly Leaf = Leaf;
  protected readonly Coins = Coins;
  protected readonly TrendingUp = TrendingUp;
  protected readonly Activity = Activity;
  protected readonly AlertTriangle = AlertTriangle;
  protected readonly Droplets = Droplets;

  constructor(
    private analyticsService: AnalyticsService,
    private wsService: WebsocketService,
    private loggingService: LoggingService,
    private store: Store,
  ) {}

  async ngOnInit(): Promise<void> {
    this.wsService.connected$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (connected) => {
        this.wsConnected = connected;
      },
      error: () => {},
    });

    // Subscribe to the global recent-readings buffer from NgRx store
    this.store
      .select(selectRecentReadings)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (readings) => {
          this.latestSensorReadings = readings;
        },
        error: () => {},
      });

    await this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected onSensorRangeChange(range: TimeRange): void {
    this.sensorTimeRange = range;
    // The store buffer is refreshed by the sensors-dashboard;
    // for the dashboard widget we just update the displayed range label.
  }

  private async loadData(): Promise<void> {
    try {
      const [overview, creditsOverTime] = await Promise.all([
        this.analyticsService.getOverview(),
        this.analyticsService.getCreditsOverTime(30),
      ]);
      this.overview = overview;
      this.creditsOverTime = creditsOverTime;
    } catch (error) {
      this.loggingService.error('Failed to load dashboard data:', error);
    } finally {
      this.loading = false;
    }
  }

  getMintedHeight(value: number): number {
    return this.getChartBarHeight(value);
  }

  getRetiredHeight(value: number): number {
    return this.getChartBarHeight(value);
  }

  private getChartBarHeight(value: number): number {
    const max = Math.max(...this.creditsOverTime.map((p) => Math.max(p.minted, p.retired)), 1);
    return (value / max) * 200;
  }
}
