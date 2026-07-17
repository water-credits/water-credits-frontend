import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { SensorsService } from '../../../core/services/sensors.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SensorDevice } from '../../../core/models/sensor-reading.model';
import {
  DataTableComponent,
  ColumnDef,
} from '../../../shared/components/data-table/data-table.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';
import {
  LucideAngularModule,
  Plus,
  ChevronLeft,
  Save,
  X,
  Gauge,
  Activity,
  Droplets,
  Thermometer,
  Wind,
  Atom,
  FlaskConical,
  Beaker,
} from 'lucide-angular';
import { AlertThreshold } from '../../../core/models/shared-interfaces.model';

const DEFAULT_THRESHOLDS: AlertThreshold[] = [
  {
    key: 'ph',
    label: 'pH',
    unit: '',
    enabled: true,
    min: 6.5,
    max: 8.5,
    warningMin: 6.0,
    warningMax: 9.0,
  },
  {
    key: 'turbidity',
    label: 'Turbidity',
    unit: 'NTU',
    enabled: true,
    min: 0,
    max: 5,
    warningMin: 0,
    warningMax: 15,
  },
  {
    key: 'dissolvedOxygen',
    label: 'Dissolved O₂',
    unit: 'mg/L',
    enabled: true,
    min: 6,
    max: 20,
    warningMin: 4,
    warningMax: 20,
  },
  {
    key: 'flowRate',
    label: 'Flow Rate',
    unit: 'm³/s',
    enabled: false,
    min: 0.1,
    max: 100,
    warningMin: 0.05,
    warningMax: 100,
  },
  {
    key: 'nitrogen',
    label: 'Nitrogen',
    unit: 'mg/L',
    enabled: true,
    min: 0,
    max: 2,
    warningMin: 0,
    warningMax: 5,
  },
  {
    key: 'phosphorus',
    label: 'Phosphorus',
    unit: 'mg/L',
    enabled: true,
    min: 0,
    max: 0.5,
    warningMin: 0,
    warningMax: 1.0,
  },
  {
    key: 'temperature',
    label: 'Temperature',
    unit: '°C',
    enabled: true,
    min: 15,
    max: 25,
    warningMin: 10,
    warningMax: 30,
  },
];

@Component({
  selector: 'app-sensor-config',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    NgIf,
    NgFor,
    DataTableComponent,
    LoadingSpinnerComponent,
    LucideAngularModule,
  ],
  template: `
    <div class="space-y-6">
      <div>
        <a
          routerLink="/sensors"
          class="inline-flex items-center gap-1 text-sm text-stellar-blue hover:text-stellar-blue-light mb-4"
        >
          <lucide-angular [img]="ChevronLeft" class="w-4 h-4"></lucide-angular>
          Back to Dashboard
        </a>
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Sensor Configuration</h1>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage devices and alert thresholds
            </p>
          </div>
          <button
            (click)="showRegisterForm = !showRegisterForm"
            class="btn btn-primary flex items-center gap-2"
          >
            <lucide-angular [img]="Plus" class="w-4 h-4"></lucide-angular>
            {{ showRegisterForm ? 'Cancel' : 'Register Device' }}
          </button>
        </div>
      </div>

      <div *ngIf="showRegisterForm" class="card p-6">
        <h2 class="text-lg font-semibold text-slate-900 dark:text-white mb-1">
          Register New Device
        </h2>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Add a new sensor device to start collecting water quality data.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label class="label">Device ID *</label>
            <input
              type="text"
              [(ngModel)]="newDevice.deviceId"
              class="input"
              placeholder="e.g., WQ-001"
            />
          </div>
          <div>
            <label class="label">Manufacturer *</label>
            <input
              type="text"
              [(ngModel)]="newDevice.manufacturer"
              class="input"
              placeholder="e.g., AquaMeasure"
            />
          </div>
          <div>
            <label class="label">Model *</label>
            <input
              type="text"
              [(ngModel)]="newDevice.model"
              class="input"
              placeholder="e.g., Pro-X 2000"
            />
          </div>
          <div>
            <label class="label">Public Key</label>
            <input
              type="text"
              [(ngModel)]="newDevice.publicKey"
              class="input font-mono text-xs"
              placeholder="Stellar public key (G...)"
            />
          </div>
        </div>

        <div class="mb-6">
          <label class="label mb-2">Parameters</label>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
            <label
              *ngFor="let param of availableParams"
              class="flex items-center gap-2 p-2 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <input
                type="checkbox"
                [checked]="newDevice.parameters.includes(param.key)"
                (change)="toggleParam(param.key)"
                class="rounded border-slate-300 text-stellar-blue focus:ring-stellar-blue"
              />
              <span class="text-sm text-slate-700 dark:text-slate-300">{{ param.label }}</span>
            </label>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            (click)="showRegisterForm = false"
            class="btn btn-outline flex items-center gap-2"
          >
            <lucide-angular [img]="X" class="w-4 h-4"></lucide-angular>
            Cancel
          </button>
          <button
            (click)="registerDevice()"
            [disabled]="saving || !isFormValid"
            class="btn btn-primary flex items-center gap-2"
          >
            <lucide-angular *ngIf="!saving" [img]="Save" class="w-4 h-4"></lucide-angular>
            <svg
              *ngIf="saving"
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
            {{ saving ? 'Registering...' : 'Register Device' }}
          </button>
        </div>
      </div>

      <div class="card p-5">
        <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Devices</h3>
        <div *ngIf="devicesLoading" class="py-8">
          <app-loading-spinner size="md" label="Loading devices..."></app-loading-spinner>
        </div>
        <app-data-table
          *ngIf="!devicesLoading"
          [columns]="deviceColumns"
          [data]="devices"
          [loading]="false"
          emptyTitle="No devices registered"
          emptyMessage="Register your first sensor device to start monitoring."
        />
      </div>

      <div class="card p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300">Alert Thresholds</h3>
          <button
            (click)="saveThresholds()"
            class="btn btn-primary btn-sm flex items-center gap-1.5 text-xs"
          >
            <lucide-angular [img]="Save" class="w-3.5 h-3.5"></lucide-angular>
            Save Thresholds
          </button>
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Configure acceptable ranges for each water quality parameter. Readings outside the warning
          range will trigger alerts.
        </p>
        <div class="space-y-4">
          <div
            *ngFor="let threshold of thresholds"
            class="p-4 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <div
                  class="w-7 h-7 rounded flex items-center justify-center bg-slate-100 dark:bg-slate-700"
                >
                  <lucide-angular
                    [img]="getThresholdIcon(threshold.key)"
                    class="w-3.5 h-3.5 text-slate-500"
                  ></lucide-angular>
                </div>
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300">{{
                  threshold.label
                }}</span>
                <span class="text-xs text-slate-400">{{ threshold.unit }}</span>
              </div>
              <label class="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                <input
                  type="checkbox"
                  [(ngModel)]="threshold.enabled"
                  class="rounded border-slate-300 text-stellar-blue focus:ring-stellar-blue"
                />
                Enabled
              </label>
            </div>
            <div *ngIf="threshold.enabled" class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="text-xs text-slate-500 mb-1 block">Good Range</label>
                <div class="flex items-center gap-2">
                  <input
                    type="number"
                    [(ngModel)]="threshold.min"
                    class="input text-sm w-24"
                    step="any"
                  />
                  <span class="text-xs text-slate-400">to</span>
                  <input
                    type="number"
                    [(ngModel)]="threshold.max"
                    class="input text-sm w-24"
                    step="any"
                  />
                </div>
              </div>
              <div>
                <label class="text-xs text-slate-500 mb-1 block">Warning Range</label>
                <div class="flex items-center gap-2">
                  <input
                    type="number"
                    [(ngModel)]="threshold.warningMin"
                    class="input text-sm w-24"
                    step="any"
                  />
                  <span class="text-xs text-slate-400">to</span>
                  <input
                    type="number"
                    [(ngModel)]="threshold.warningMax"
                    class="input text-sm w-24"
                    step="any"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class SensorConfigComponent implements OnInit {
  protected devices: SensorDevice[] = [];
  protected devicesLoading = true;
  protected showRegisterForm = false;
  protected saving = false;
  protected thresholds: AlertThreshold[] = JSON.parse(JSON.stringify(DEFAULT_THRESHOLDS));
  protected availableParams = DEFAULT_THRESHOLDS;

  protected newDevice: {
    deviceId: string;
    manufacturer: string;
    model: string;
    publicKey: string;
    parameters: string[];
  } = {
    deviceId: '',
    manufacturer: '',
    model: '',
    publicKey: '',
    parameters: [],
  };

  protected readonly Plus = Plus;
  protected readonly ChevronLeft = ChevronLeft;
  protected readonly Save = Save;
  protected readonly X = X;
  protected readonly Gauge = Gauge;
  protected readonly Activity = Activity;
  protected readonly Droplets = Droplets;
  protected readonly Thermometer = Thermometer;
  protected readonly Wind = Wind;
  protected readonly Atom = Atom;
  protected readonly FlaskConical = FlaskConical;
  protected readonly Beaker = Beaker;

  protected deviceColumns: ColumnDef<SensorDevice>[] = [
    { key: 'deviceId', label: 'Device ID', sortable: true },
    { key: 'manufacturer', label: 'Manufacturer', sortable: true },
    { key: 'model', label: 'Model', sortable: true },
    { key: 'parameters', label: 'Parameters', sortable: false },
    { key: 'isActive', label: 'Status', sortable: true },
    { key: 'lastReadingAt', label: 'Last Reading', sortable: true },
    { key: 'publicKey', label: 'Public Key', sortable: false },
  ];

  constructor(
    private sensorsService: SensorsService,
    private notificationService: NotificationService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadDevices();
  }

  private async loadDevices(): Promise<void> {
    try {
      this.devices = await this.sensorsService.getDevices();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not fetch device list';
      this.notificationService.error('Failed to load devices', message);
    } finally {
      this.devicesLoading = false;
    }
  }

  get isFormValid(): boolean {
    return (
      !!this.newDevice.deviceId &&
      !!this.newDevice.manufacturer &&
      !!this.newDevice.model &&
      this.newDevice.parameters.length > 0
    );
  }

  protected toggleParam(key: string): void {
    const idx = this.newDevice.parameters.indexOf(key);
    if (idx >= 0) {
      this.newDevice.parameters.splice(idx, 1);
    } else {
      this.newDevice.parameters.push(key);
    }
  }

  protected async registerDevice(): Promise<void> {
    if (!this.isFormValid) return;
    this.saving = true;
    try {
      const device = await this.sensorsService.registerDevice({
        deviceId: this.newDevice.deviceId,
        manufacturer: this.newDevice.manufacturer,
        model: this.newDevice.model,
        publicKey: this.newDevice.publicKey || undefined,
        parameters: this.newDevice.parameters,
        projectId: '',
        isActive: true,
        createdAt: new Date().toISOString(),
      });
      this.devices.push(device);
      this.notificationService.success(
        'Device registered',
        `${device.deviceId} has been registered successfully`,
      );
      this.showRegisterForm = false;
      this.newDevice = { deviceId: '', manufacturer: '', model: '', publicKey: '', parameters: [] };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      this.notificationService.error('Failed to register device', message);
    } finally {
      this.saving = false;
    }
  }

  protected saveThresholds(): void {
    localStorage.setItem('sensor-alert-thresholds', JSON.stringify(this.thresholds));
    this.notificationService.success('Thresholds saved', 'Alert thresholds have been updated');
  }

  protected getThresholdIcon(key: string): any {
    const icons: Record<string, any> = {
      ph: this.Beaker,
      turbidity: this.Droplets,
      dissolvedOxygen: this.Wind,
      flowRate: this.Gauge,
      nitrogen: this.Atom,
      phosphorus: this.FlaskConical,
      temperature: this.Thermometer,
    };
    return icons[key] || this.Activity;
  }
}
