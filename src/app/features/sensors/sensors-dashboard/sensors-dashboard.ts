import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { NgIf, NgFor, DecimalPipe } from '@angular/common';
import { Subject, takeUntil, interval } from 'rxjs';
import {
  SensorParameterKey,
  SensorDevice,
  SensorReading,
} from '../../../core/models/sensor-reading.model';
import { getSensorValue } from '../../../core/utils/sensor.utils';
import { AppState } from '../../../core/store/app.state';
import { SensorsService } from '../../../core/services/sensors.service';
import { WebsocketService } from '../../../core/services/websocket.service';
import { NotificationService } from '../../../core/services/notification.service';
import {
  DataTableComponent,
  ColumnDef,
} from '../../../shared/components/data-table/data-table.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';
import { SensorChartComponent } from '../../../shared/components/sensor-chart/sensor-chart';
import {
  SensorParameter,
  TimeRange,
} from '../../../shared/components/sensor-chart/sensor-parameter.model';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import * as SensorsActions from '../../../core/store/sensors/sensors.actions';
import {
  LucideAngularModule,
  Activity,
  Droplets,
  Thermometer,
  Gauge,
  Wind,
  Atom,
  Beaker,
  FlaskConical,
  RefreshCw,
  Settings,
  Radio,
} from 'lucide-angular';
import { ParameterConfig } from '../../../core/models/shared-interfaces.model';

const PARAMETER_CONFIGS: ParameterConfig[] = [
  { key: 'ph', label: 'pH', unit: '', icon: Beaker, color: '#7B2FBE', decimals: 2 },
  {
    key: 'turbidity',
    label: 'Turbidity',
    unit: 'NTU',
    icon: Droplets,
    color: '#F59E0B',
    decimals: 1,
  },
  {
    key: 'dissolvedOxygen',
    label: 'Dissolved O₂',
    unit: 'mg/L',
    icon: Wind,
    color: '#3B82F6',
    decimals: 1,
  },
  { key: 'flowRate', label: 'Flow Rate', unit: 'm³/s', icon: Gauge, color: '#10B981', decimals: 3 },
  { key: 'nitrogen', label: 'Nitrogen', unit: 'mg/L', icon: Atom, color: '#EF4444', decimals: 2 },
  {
    key: 'phosphorus',
    label: 'Phosphorus',
    unit: 'mg/L',
    icon: FlaskConical,
    color: '#EC4899',
    decimals: 3,
  },
  {
    key: 'temperature',
    label: 'Temperature',
    unit: '°C',
    icon: Thermometer,
    color: '#F97316',
    decimals: 1,
  },
];

const STATUS_THRESHOLDS: Record<
  SensorParameterKey,
  { good: [number, number]; warning: [number, number] }
> = {
  ph: { good: [6.5, 8.5], warning: [6.0, 9.0] },
  turbidity: { good: [0, 5], warning: [0, 15] },
  dissolvedOxygen: { good: [6, 20], warning: [4, 20] },
  flowRate: { good: [0.1, 100], warning: [0.05, 100] },
  nitrogen: { good: [0, 2], warning: [0, 5] },
  phosphorus: { good: [0, 0.5], warning: [0, 1.0] },
  temperature: { good: [15, 25], warning: [10, 30] },
};

/** pH thresholds shown as annotation lines per acceptance criteria */
const CHART_THRESHOLDS: Record<string, { low?: number; high?: number }> = {
  ph: { low: 6.5, high: 8.5 },
};

@Component({
  selector: 'app-sensors-dashboard',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    DecimalPipe,
    RouterLink,
    DataTableComponent,
    LoadingSpinnerComponent,
    SensorChartComponent,
    DateFormatPipe,
    LucideAngularModule,
  ],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Sensor Dashboard</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time water quality monitoring
          </p>
        </div>
        <div class="flex items-center gap-3">
          <div
            class="flex items-center gap-2 bg-white dark:bg-dark-bg-lighter rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5"
          >
            <span
              class="w-2 h-2 rounded-full"
              [class]="wsConnected ? 'bg-green-500' : 'bg-red-500'"
            ></span>
            <span class="text-xs text-slate-500">{{
              wsConnected ? 'Connected' : 'Disconnected'
            }}</span>
          </div>
          <button
            (click)="toggleAutoRefresh()"
            [class]="
              autoRefresh
                ? 'bg-stellar-blue/10 text-stellar-blue border-stellar-blue/30'
                : 'text-slate-400 border-slate-200 dark:border-slate-700'
            "
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <lucide-angular
              [img]="RefreshCwIcon"
              class="w-3.5 h-3.5"
              [class.animate-spin]="autoRefresh"
            ></lucide-angular>
            {{ autoRefresh ? 'Auto' : 'Manual' }}
          </button>
          <a routerLink="/sensors/config" class="btn btn-outline flex items-center gap-2 text-xs">
            <lucide-angular [img]="SettingsIcon" class="w-3.5 h-3.5"></lucide-angular>
            Configure
          </a>
        </div>
      </div>

      <div *ngIf="loading" class="flex items-center justify-center py-20">
        <app-loading-spinner size="lg" label="Loading sensor data..."></app-loading-spinner>
      </div>

      <ng-container *ngIf="!loading">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div *ngFor="let param of parameterConfigs; trackBy: trackByParam" class="card p-4">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <div
                  class="w-8 h-8 rounded-lg flex items-center justify-center"
                  [style.background]="param.color + '20'"
                >
                  <lucide-angular
                    [img]="param.icon"
                    class="w-4 h-4"
                    [style.color]="param.color"
                  ></lucide-angular>
                </div>
                <span
                  class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                  >{{ param.label }}</span
                >
              </div>
              <div class="flex items-center gap-1.5">
                <span *ngIf="param.unit" class="text-xs text-slate-400">{{ param.unit }}</span>
                <span
                  class="w-2 h-2 rounded-full"
                  [class]="getStatusDot(param.key, getLatestValue(param.key))"
                ></span>
              </div>
            </div>
            <div class="flex items-baseline gap-1 mb-3">
              <span class="text-2xl font-bold text-slate-900 dark:text-white">
                {{
                  getLatestValue(param.key) != null
                    ? (getLatestValue(param.key) | number: '1.0-' + param.decimals)
                    : '--'
                }}
              </span>
              <span *ngIf="param.unit" class="text-xs text-slate-400">{{ param.unit }}</span>
            </div>
            <div class="flex items-end gap-px h-12">
              <div
                *ngFor="let val of sparklineData[param.key] || []; let i = index"
                class="flex-1 rounded-t transition-all duration-300"
                [style.height.%]="
                  (sparklineMax[param.key] || 0) > 0
                    ? (val / (sparklineMax[param.key] || 1)) * 100
                    : 0
                "
                [style.background]="param.color"
                [style.opacity]="0.3 + (i / (sparklineData[param.key]?.length || 1)) * 0.7"
              ></div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <app-sensor-chart
            [title]="'Recent Readings'"
            [data]="recentReadings"
            [parameters]="chartParameters"
            [timeRange]="selectedTimeRange"
            [thresholds]="chartThresholds"
            (rangeChange)="onRangeChange($event)"
            [height]="280"
          />
          <div class="card p-5">
            <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
              Latest Values
            </h3>
            <div *ngIf="!latestReading" class="text-center py-8 text-sm text-slate-400">
              No readings available
            </div>
            <div *ngIf="latestReading" class="space-y-3">
              <div
                *ngFor="let param of parameterConfigs; trackBy: trackByParam"
                class="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0"
              >
                <div class="flex items-center gap-2">
                  <div
                    class="w-6 h-6 rounded flex items-center justify-center"
                    [style.background]="param.color + '20'"
                  >
                    <lucide-angular
                      [img]="param.icon"
                      class="w-3 h-3"
                      [style.color]="param.color"
                    ></lucide-angular>
                  </div>
                  <span class="text-sm text-slate-600 dark:text-slate-400">{{ param.label }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-slate-900 dark:text-white">
                    {{
                      getLatestValue(param.key) != null
                        ? (getLatestValue(param.key) | number: '1.0-' + param.decimals)
                        : '--'
                    }}
                  </span>
                  <span
                    class="w-2 h-2 rounded-full"
                    [class]="getStatusDot(param.key, getLatestValue(param.key))"
                  ></span>
                </div>
              </div>
              <div class="pt-2 text-xs text-slate-400">
                Last updated: {{ latestReading.timestamp | dateFormat: 'relative' }}
              </div>
            </div>
          </div>
        </div>

        <div class="card p-5">
          <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
            Registered Devices
          </h3>
          <app-data-table
            [columns]="deviceColumns"
            [data]="devices"
            [loading]="false"
            emptyTitle="No devices registered"
            emptyMessage="Register a sensor device to start monitoring water quality."
          />
        </div>
      </ng-container>
    </div>
  `,
})
export class SensorsDashboardComponent implements OnInit, OnDestroy {
  protected loading = true;
  protected devices: SensorDevice[] = [];
  protected recentReadings: SensorReading[] = [];
  protected latestReading: SensorReading | null = null;
  protected wsConnected = false;
  protected autoRefresh = false;
  protected sparklineData: Partial<Record<SensorParameterKey, number[]>> = {};
  protected sparklineMax: Partial<Record<SensorParameterKey, number>> = {};
  protected parameterConfigs = PARAMETER_CONFIGS;
  protected selectedTimeRange: TimeRange = '24h';
  protected chartThresholds = CHART_THRESHOLDS;

  /** SensorParameter[] built from PARAMETER_CONFIGS for the new chart API */
  protected chartParameters: SensorParameter[] = PARAMETER_CONFIGS.map((p) => ({
    key: p.key,
    label: p.label,
    unit: p.unit,
    color: p.color,
    decimals: p.decimals,
  }));

  private refreshInterval = 30000;
  private destroy$ = new Subject<void>();

  protected readonly ActivityIcon = Activity;
  protected readonly DropletsIcon = Droplets;
  protected readonly ThermometerIcon = Thermometer;
  protected readonly GaugeIcon = Gauge;
  protected readonly WindIcon = Wind;
  protected readonly AtomIcon = Atom;
  protected readonly BeakerIcon = Beaker;
  protected readonly FlaskConicalIcon = FlaskConical;
  protected readonly RefreshCwIcon = RefreshCw;
  protected readonly SettingsIcon = Settings;
  protected readonly RadioIcon = Radio;

  protected deviceColumns: ColumnDef<SensorDevice>[] = [
    { key: 'deviceId', label: 'Device ID', sortable: true },
    { key: 'manufacturer', label: 'Manufacturer', sortable: true },
    { key: 'model', label: 'Model', sortable: true },
    { key: 'parameters', label: 'Parameters', sortable: false },
    { key: 'isActive', label: 'Status', sortable: true },
    { key: 'lastReadingAt', label: 'Last Reading', sortable: true },
  ];

  constructor(
    private store: Store<AppState>,
    private sensorsService: SensorsService,
    private wsService: WebsocketService,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.wsService.connected$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (connected) => {
        this.wsConnected = connected;
      },
      error: () => {},
    });

    this.wsService
      .on<SensorReading>('sensor:reading')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reading: SensorReading) => {
          this.store.dispatch(SensorsActions.addRealtimeReading({ reading }));
        },
        error: () => {},
      });

    this.store
      .select((state) => state.sensors)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (sensors) => {
          if (!sensors) return;
          this.devices = sensors.devices;
          this.recentReadings = sensors.recentReadings;
          this.updateDerivedData();
        },
        error: () => {},
      });

    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected onRangeChange(range: TimeRange): void {
    this.selectedTimeRange = range;
    this.loadData();
  }

  private async loadData(): Promise<void> {
    this.loading = true;
    try {
      const [devices] = await Promise.all([this.sensorsService.getDevices()]);
      this.store.dispatch(SensorsActions.loadDevicesSuccess({ devices }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load devices';
      this.store.dispatch(SensorsActions.loadDevicesFailure({ error: message }));
    } finally {
      this.loading = false;
    }
  }

  private updateDerivedData(): void {
    this.latestReading = this.recentReadings.length > 0 ? this.recentReadings[0] : null;

    const sparklines: Record<string, number[]> = {};

    for (const param of this.parameterConfigs) {
      const values: number[] = [];

      for (const r of this.recentReadings) {
        const val = getSensorValue(r, param.key);
        if (val != null) {
          values.push(val);
        }
      }

      sparklines[param.key] = values.slice(0, 20).reverse();
      this.sparklineMax[param.key] = values.length > 0 ? Math.max(...values, 0.001) : 1;
    }

    this.sparklineData = sparklines;
  }

  protected toggleAutoRefresh(): void {
    this.autoRefresh = !this.autoRefresh;
    if (this.autoRefresh) {
      interval(this.refreshInterval)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadData();
          },
          error: () => {},
        });
      this.notificationService.info(
        'Auto-refresh enabled',
        `Updating every ${this.refreshInterval / 1000}s`,
      );
    }
  }

  protected getLatestValue(paramKey: SensorParameterKey): number | null {
    if (!this.latestReading) return null;
    return getSensorValue(this.latestReading, paramKey);
  }

  protected getStatusDot(paramKey: SensorParameterKey, value: number | null): string {
    if (value == null) return 'bg-slate-300 dark:bg-slate-600';
    const thresholds = STATUS_THRESHOLDS[paramKey];
    if (!thresholds) return 'bg-slate-300 dark:bg-slate-600';
    const [goodMin, goodMax] = thresholds.good;
    const [warnMin, warnMax] = thresholds.warning;
    if (value >= goodMin && value <= goodMax) return 'bg-green-500';
    if (value >= warnMin && value <= warnMax) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  protected trackByParam(_index: number, param: ParameterConfig): string {
    return param.key;
  }
}
