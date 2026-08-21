import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AsyncPipe, NgIf } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { distinctUntilChanged, map, takeUntil } from 'rxjs/operators';
import { AppState } from '../../../core/store/app.state';
import * as FarmersActions from '../../../core/store/farmers/farmers.actions';
import * as SensorsActions from '../../../core/store/sensors/sensors.actions';
import {
  ParcelSensorView,
  selectParcelSensorView,
} from '../../../core/store/farmers/farmers-sensors.selectors';
import { SensorChartComponent } from '../../../shared/components/sensor-chart/sensor-chart';
import {
  SensorParameter,
  TimeRange,
} from '../../../shared/components/sensor-chart/sensor-parameter.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';
import { LucideAngularModule, ArrowLeft, Radio } from 'lucide-angular';

const PARCEL_SENSOR_PARAMS: SensorParameter[] = [
  { key: 'ph', label: 'pH', unit: '', color: '#7B2FBE', decimals: 2 },
  { key: 'turbidity', label: 'Turbidity', unit: 'NTU', color: '#F59E0B', decimals: 1 },
  { key: 'dissolvedOxygen', label: 'Dissolved O₂', unit: 'mg/L', color: '#3B82F6', decimals: 1 },
  { key: 'temperature', label: 'Temperature', unit: '°C', color: '#F97316', decimals: 1 },
];

@Component({
  selector: 'app-farmer-parcel-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgIf,
    AsyncPipe,
    RouterLink,
    SensorChartComponent,
    LoadingSpinnerComponent,
    StatusBadgeComponent,
    LucideAngularModule,
  ],
  template: `
    <div class="space-y-6">
      <a
        routerLink="/farmers/parcels"
        class="inline-flex items-center gap-1 text-sm text-stellar-blue hover:text-stellar-blue-light"
      >
        <lucide-angular [img]="ArrowLeft" class="w-4 h-4"></lucide-angular>
        Back to Parcels
      </a>

      <ng-container *ngIf="view$ | async as view; else loading">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
              {{ view.parcel.name }}
            </h1>
            <app-status-badge [status]="view.parcel.status"></app-status-badge>
          </div>
          <p class="text-sm text-slate-500 dark:text-slate-400">{{ view.parcel.description }}</p>
          <p class="text-xs text-slate-400 mt-2">
            {{ view.parcel.areaHectares }} ha · {{ view.devices.length }} sensor
            {{ view.devices.length === 1 ? 'device' : 'devices' }}
          </p>
        </div>

        <div *ngIf="view.devices.length === 0" class="card p-8 text-center">
          <lucide-angular
            [img]="Radio"
            class="w-8 h-8 text-slate-400 mx-auto mb-2"
          ></lucide-angular>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            No edge-of-field sensors linked to this parcel yet.
          </p>
        </div>

        <app-sensor-chart
          *ngIf="view.devices.length > 0"
          title="Edge-of-field water quality"
          [data]="view.readings"
          [parameters]="sensorParams"
          [timeRange]="timeRange"
          (rangeChange)="onRangeChange($event)"
          [height]="320"
        />
      </ng-container>

      <ng-template #loading>
        <div class="py-20">
          <app-loading-spinner size="lg" label="Loading parcel sensors..."></app-loading-spinner>
        </div>
      </ng-template>
    </div>
  `,
})
export class FarmerParcelDetailComponent implements OnInit, OnDestroy {
  protected view$: Observable<ParcelSensorView | null> = new Observable();
  protected readonly sensorParams = PARCEL_SENSOR_PARAMS;
  protected timeRange: TimeRange = '24h';
  protected readonly ArrowLeft = ArrowLeft;
  protected readonly Radio = Radio;

  private parcelId = '';
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly store: Store<AppState>,
  ) {}

  ngOnInit(): void {
    this.store.dispatch(FarmersActions.loadParcels());

    this.route.paramMap
      .pipe(
        map((params) => params.get('id') ?? ''),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe((id) => {
        if (this.parcelId && this.parcelId !== id) {
          this.store.dispatch(SensorsActions.unsubscribeFromProject({ projectId: this.parcelId }));
        }
        this.parcelId = id;
        this.view$ = this.store.select(selectParcelSensorView(id));
        if (id) {
          this.store.dispatch(SensorsActions.loadDevices({ projectId: id }));
          this.store.dispatch(SensorsActions.loadProjectReadings({ projectId: id }));
          this.store.dispatch(SensorsActions.subscribeToProject({ projectId: id }));
        }
      });
  }

  ngOnDestroy(): void {
    if (this.parcelId) {
      this.store.dispatch(SensorsActions.unsubscribeFromProject({ projectId: this.parcelId }));
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected onRangeChange(range: TimeRange): void {
    this.timeRange = range;
    if (this.parcelId) {
      this.store.dispatch(SensorsActions.loadProjectReadings({ projectId: this.parcelId }));
    }
  }
}
