import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { AsyncPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';
import {
  LucideAngularModule,
  LucideIconData,
  Leaf,
  CheckCircle,
  Circle,
  Info,
  Sprout,
  Wheat,
  Trees,
  Flower2,
  Sun,
  Loader,
} from 'lucide-angular';

import { AppState } from '../../../core/store/app.state';
import * as FarmersActions from '../../../core/store/farmers/farmers.actions';
import * as SensorsActions from '../../../core/store/sensors/sensors.actions';
import {
  selectBmps,
  selectBmpsLoading,
  selectIsPracticeEnrolling,
  selectParcels,
} from '../../../core/store/farmers/farmers.selectors';
import {
  ParcelSensorView,
  selectParcelsWithSensors,
} from '../../../core/store/farmers/farmers-sensors.selectors';
import { Bmp } from '../../../core/models/bmp.model';
import { SensorChartComponent } from '../../../shared/components/sensor-chart/sensor-chart';
import { SensorParameter } from '../../../shared/components/sensor-chart/sensor-parameter.model';

const BMP_ICON_MAP: Record<string, unknown> = {
  'cover-crops': Sprout,
  'no-till': Sun,
  'buffer-strips': Trees,
  'managed-grazing': Wheat,
  compost: Flower2,
};

const DEFAULT_ICON = Sprout;

const PARCEL_SENSOR_PARAMS: SensorParameter[] = [
  { key: 'ph', label: 'pH', unit: '', color: '#7B2FBE', decimals: 2 },
  { key: 'turbidity', label: 'Turbidity', unit: 'NTU', color: '#F59E0B', decimals: 1 },
  { key: 'dissolvedOxygen', label: 'Dissolved O₂', unit: 'mg/L', color: '#3B82F6', decimals: 1 },
  { key: 'temperature', label: 'Temperature', unit: '°C', color: '#F97316', decimals: 1 },
];

@Component({
  selector: 'app-farmer-practices',
  standalone: true,
  imports: [NgIf, NgFor, NgClass, AsyncPipe, LucideAngularModule, SensorChartComponent],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Best Management Practices</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Enroll in BMP programs to earn water quality credits
        </p>
      </div>

      <div
        *ngIf="bmpsLoading$ | async"
        class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
      >
        <div
          *ngFor="let _ of [1, 2, 3, 4, 5]"
          class="card p-5 border border-slate-200 dark:border-slate-700 animate-pulse"
        >
          <div class="flex items-start gap-3 mb-3">
            <div class="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700"></div>
            <div class="flex-1 space-y-2">
              <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
              <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
            </div>
          </div>
          <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded mb-1 w-full"></div>
          <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
        </div>
      </div>

      <div
        *ngIf="!(bmpsLoading$ | async)"
        class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
      >
        <div
          *ngFor="let bmp of bmps$ | async; trackBy: trackByBmpId"
          class="card p-5 border"
          [ngClass]="
            bmp.enrolled
              ? 'border-environmental-green/30'
              : 'border-slate-200 dark:border-slate-700'
          "
        >
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-3">
              <div
                [ngClass]="
                  bmp.enrolled ? 'bg-environmental-green/10' : 'bg-slate-100 dark:bg-dark-bg'
                "
                class="w-10 h-10 rounded-xl flex items-center justify-center"
              >
                <lucide-angular
                  [img]="resolveIcon(bmp)"
                  class="w-5 h-5"
                  [ngClass]="
                    bmp.enrolled ? 'text-environmental-green' : 'text-slate-500 dark:text-slate-400'
                  "
                ></lucide-angular>
              </div>
              <div>
                <h3 class="font-semibold text-slate-900 dark:text-white">{{ bmp.name }}</h3>
                <span class="text-xs text-slate-400 capitalize">{{ bmp.category }}</span>
              </div>
            </div>

            <button
              (click)="toggleBmp(bmp)"
              class="shrink-0 transition-opacity"
              [disabled]="isEnrolling(bmp.id) | async"
              [class.opacity-50]="isEnrolling(bmp.id) | async"
              [class.cursor-not-allowed]="isEnrolling(bmp.id) | async"
              [ngClass]="
                bmp.enrolled
                  ? 'text-environmental-green'
                  : 'text-slate-300 dark:text-slate-600 hover:text-slate-400'
              "
              [attr.aria-label]="(bmp.enrolled ? 'Unenroll from ' : 'Enroll in ') + bmp.name"
              [attr.aria-pressed]="bmp.enrolled"
            >
              <lucide-angular
                *ngIf="isEnrolling(bmp.id) | async; else toggleIcon"
                [img]="Loader"
                class="w-6 h-6 animate-spin"
              ></lucide-angular>
              <ng-template #toggleIcon>
                <lucide-angular
                  [img]="bmp.enrolled ? CheckCircle : Circle"
                  class="w-6 h-6"
                ></lucide-angular>
              </ng-template>
            </button>
          </div>

          <p class="text-sm text-slate-500 dark:text-slate-400 mb-3">{{ bmp.description }}</p>

          <div class="mb-3">
            <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Requirements</p>
            <ul class="space-y-1">
              <li
                *ngFor="let req of bmp.requirements"
                class="text-xs text-slate-400 flex items-start gap-1.5"
              >
                <span class="mt-0.5">-</span>
                <span>{{ req }}</span>
              </li>
            </ul>
          </div>

          <div
            class="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700"
          >
            <div class="flex items-center gap-1 text-sm">
              <lucide-angular
                [img]="Leaf"
                class="w-3.5 h-3.5 text-environmental-green"
              ></lucide-angular>
              <span class="font-semibold text-environmental-green">{{ bmp.estimatedCredits }}</span>
              <span class="text-xs text-slate-400">credits/yr</span>
            </div>
            <span
              *ngIf="bmp.enrolled"
              class="text-xs bg-environmental-green/10 text-environmental-green px-2 py-0.5 rounded-full font-medium"
              >Enrolled</span
            >
          </div>
        </div>
      </div>

      <div *ngIf="(parcelsWithSensors$ | async)?.length" class="space-y-4">
        <div>
          <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Parcel water quality</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Edge-of-field sensor readings linked to each parcel
          </p>
        </div>
        <div
          *ngFor="let view of parcelsWithSensors$ | async; trackBy: trackByParcelId"
          class="space-y-2"
        >
          <h3 class="text-sm font-medium text-slate-700 dark:text-slate-300">
            {{ view.parcel.name }}
            <span class="text-xs text-slate-400 font-normal">
              · {{ view.devices.length }} device{{ view.devices.length === 1 ? '' : 's' }}
            </span>
          </h3>
          <app-sensor-chart
            [title]="view.parcel.name + ' — edge-of-field'"
            [data]="view.readings"
            [parameters]="sensorParams"
            [height]="260"
          />
        </div>
      </div>

      <div class="card p-5 bg-stellar-blue/5 border border-stellar-blue/10">
        <div class="flex items-start gap-3">
          <lucide-angular
            [img]="Info"
            class="w-5 h-5 text-stellar-blue mt-0.5 shrink-0"
          ></lucide-angular>
          <div>
            <h3 class="text-sm font-semibold text-slate-900 dark:text-white mb-1">About BMPs</h3>
            <p class="text-sm text-slate-500 dark:text-slate-400">
              Best Management Practices (BMPs) are agricultural practices that improve water quality
              and soil health. Each enrolled BMP generates verified water quality credits based on
              estimated environmental impact. Credits are issued after verification and can be sold
              on the marketplace or retired.
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class FarmerPracticesComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store<AppState>);
  private readonly destroy$ = new Subject<void>();
  private readonly requestedReadings = new Set<string>();

  protected readonly bmps$: Observable<Bmp[]> = this.store.select(selectBmps);
  protected readonly bmpsLoading$: Observable<boolean> = this.store.select(selectBmpsLoading);
  protected readonly sensorParams = PARCEL_SENSOR_PARAMS;
  protected readonly parcelsWithSensors$: Observable<ParcelSensorView[]> = this.store
    .select(selectParcelsWithSensors)
    .pipe(map((views) => views.filter((v) => v.devices.length > 0)));

  protected readonly Leaf = Leaf;
  protected readonly CheckCircle = CheckCircle;
  protected readonly Circle = Circle;
  protected readonly Info = Info;
  protected readonly Loader = Loader;

  ngOnInit(): void {
    this.store.dispatch(FarmersActions.loadBmps());
    this.store.dispatch(FarmersActions.loadParcels());
    this.store.dispatch(SensorsActions.loadDevices({}));

    this.store
      .select(selectParcels)
      .pipe(
        filter((parcels) => parcels.length > 0),
        takeUntil(this.destroy$),
      )
      .subscribe((parcels) => {
        for (const parcel of parcels) {
          if (this.requestedReadings.has(parcel.id)) continue;
          this.requestedReadings.add(parcel.id);
          this.store.dispatch(SensorsActions.loadProjectReadings({ projectId: parcel.id }));
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleBmp(bmp: Bmp): void {
    if (bmp.enrolled) {
      this.store.dispatch(FarmersActions.unenrollPractice({ practiceId: bmp.id }));
    } else {
      this.store.dispatch(FarmersActions.enrollPractice({ practiceId: bmp.id }));
    }
  }

  isEnrolling(practiceId: string): Observable<boolean> {
    return this.store.select(selectIsPracticeEnrolling(practiceId));
  }

  trackByBmpId(_index: number, bmp: Bmp): string {
    return bmp.id;
  }

  trackByParcelId(_index: number, view: ParcelSensorView): string {
    return view.parcel.id;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolveIcon(bmp: Bmp): LucideIconData {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (bmp.icon ?? BMP_ICON_MAP[bmp.id] ?? DEFAULT_ICON) as LucideIconData;
  }
}
