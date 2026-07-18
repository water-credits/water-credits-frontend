import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GovernanceService } from '../../../core/services/governance.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';
import { GovernanceConfig } from '../../../core/models/proposal.model';
import { LucideAngularModule, Save, RotateCcw, Settings } from 'lucide-angular';
import { getErrorMessage } from '../../../core/utils/error.utils';

@Component({
  selector: 'app-admin-fees',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, LoadingSpinnerComponent, LucideAngularModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Fees & Parameters</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure protocol fees, voting parameters, and quality weights
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="resetForm()" class="btn btn-outline flex items-center gap-2">
            <lucide-angular [img]="RotateCcw" class="w-4 h-4"></lucide-angular>
            Reset
          </button>
          <button
            (click)="saveConfig()"
            [disabled]="saving"
            class="btn btn-primary flex items-center gap-2"
          >
            <lucide-angular [img]="Save" class="w-4 h-4"></lucide-angular>
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>

      <div *ngIf="loading" class="flex items-center justify-center py-20">
        <app-loading-spinner size="lg" label="Loading configuration..."></app-loading-spinner>
      </div>

      <ng-container *ngIf="!loading">
        <div class="card p-6">
          <h3
            class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-6 flex items-center gap-2"
          >
            <lucide-angular [img]="Settings" class="w-4 h-4 text-slate-400"></lucide-angular>
            Governance Configuration
          </h3>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <p class="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">
                Current Values
              </p>
              <div class="space-y-3">
                <div
                  *ngFor="let field of configFields"
                  class="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 dark:bg-dark-bg"
                >
                  <span class="text-sm text-slate-600 dark:text-slate-400">{{ field.label }}</span>
                  <span class="text-sm font-semibold text-slate-700 dark:text-slate-300">{{
                    getCurrentDisplay(field)
                  }}</span>
                </div>
              </div>
            </div>

            <div>
              <p class="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">
                Proposed Values
              </p>
              <div class="space-y-4">
                <div *ngFor="let field of configFields" class="space-y-1">
                  <label class="text-xs font-medium text-slate-500 dark:text-slate-400">{{
                    field.label
                  }}</label>
                  <div *ngIf="field.type === 'number'" class="relative">
                    <input
                      type="number"
                      [ngModel]="formValues[field.key]"
                      (ngModelChange)="onFieldChange(field.key, $event)"
                      [step]="field.step || '1'"
                      [min]="field.min ?? 0"
                      [max]="field.max ?? 0"
                      class="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-bg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-stellar-blue/50"
                    />
                  </div>
                  <div *ngIf="field.type === 'percentage'" class="relative">
                    <input
                      type="number"
                      [ngModel]="formValues[field.key]"
                      (ngModelChange)="onFieldChange(field.key, $event)"
                      step="0.01"
                      min="0"
                      max="100"
                      class="w-full px-3 py-2 pr-8 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-bg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-stellar-blue/50"
                    />
                    <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400"
                      >%</span
                    >
                  </div>
                  <p *ngIf="field.description" class="text-xs text-slate-400">
                    {{ field.description }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
})
export class AdminFeesComponent implements OnInit {
  protected loading = true;
  protected saving = false;
  protected currentConfig: GovernanceConfig | null = null;
  protected formValues: Record<string, number> = {};

  protected readonly Save = Save;
  protected readonly RotateCcw = RotateCcw;
  protected readonly Settings = Settings;

  protected configFields: Array<{
    key: string;
    label: string;
    type: 'number' | 'percentage';
    step?: string;
    min?: number;
    max?: number;
    description?: string;
  }> = [
    {
      key: 'protocolFee',
      label: 'Protocol Fee',
      type: 'percentage',
      description: 'Fee percentage charged on credit transactions',
    },
    {
      key: 'voteDuration',
      label: 'Vote Duration',
      type: 'number',
      description: 'Duration in seconds for governance votes',
    },
    {
      key: 'timelockDuration',
      label: 'Timelock Duration',
      type: 'number',
      description: 'Delay in seconds before execution after approval',
    },
    {
      key: 'quorumThreshold',
      label: 'Quorum Threshold',
      type: 'percentage',
      description: 'Minimum percentage of votes required for quorum',
    },
    {
      key: 'minOracleThreshold',
      label: 'Min Oracle Threshold',
      type: 'number',
      description: 'Minimum number of oracles required for validation',
    },
    {
      key: 'qualityPenaltyWeight',
      label: 'Quality Penalty Weight',
      type: 'number',
      step: '0.01',
      description: 'Weight applied for quality penalties',
    },
    {
      key: 'nRemovalWeight',
      label: 'N Removal Weight',
      type: 'number',
      step: '0.01',
      description: 'Weight for nitrogen removal calculations',
    },
    {
      key: 'pRemovalWeight',
      label: 'P Removal Weight',
      type: 'number',
      step: '0.01',
      description: 'Weight for phosphorus removal calculations',
    },
  ];

  constructor(
    private governanceService: GovernanceService,
    private notification: NotificationService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadConfig();
  }

  onFieldChange(key: string, value: number): void {
    this.formValues[key] = value;
  }

  getCurrentDisplay(field: { key: string; label: string; type: 'number' | 'percentage' }): string {
    if (!this.currentConfig) return '-';
    const val = (this.currentConfig as any)[field.key];
    if (val === undefined || val === null) return '-';
    if (field.type === 'percentage') return `${val}%`;
    if (field.key === 'voteDuration' || field.key === 'timelockDuration')
      return this.formatDuration(val);
    return String(val);
  }

  private formatDuration(seconds: number): string {
    if (seconds >= 86400) return `${seconds / 86400}d`;
    if (seconds >= 3600) return `${seconds / 3600}h`;
    return `${seconds}s`;
  }

  resetForm(): void {
    if (this.currentConfig) {
      for (const field of this.configFields) {
        this.formValues[field.key] = (this.currentConfig as any)[field.key] ?? 0;
      }
    }
  }

  async saveConfig(): Promise<void> {
    if (!this.currentConfig) return;
    this.saving = true;
    try {
      const changed: Record<string, number> = {};
      for (const field of this.configFields) {
        const current = (this.currentConfig as any)[field.key];
        const proposed = this.formValues[field.key];
        if (current !== proposed) {
          changed[field.key] = proposed;
        }
      }
      if (Object.keys(changed).length === 0) {
        this.notification.info('No Changes', 'No configuration values have been modified.');
        this.saving = false;
        return;
      }
      await this.governanceService.updateConfig(changed as Partial<GovernanceConfig>);
      this.notification.success(
        'Configuration Updated',
        'Governance configuration has been saved successfully.',
      );
      await this.loadConfig();
    } catch (error) {
      this.notification.error(
        'Save Failed',
        getErrorMessage(error, 'Could not update configuration. Please try again.'),
      );
    } finally {
      this.saving = false;
    }
  }

  private async loadConfig(): Promise<void> {
    try {
      this.currentConfig = await this.governanceService.getConfig();
      this.resetForm();
    } catch (error) {
      this.notification.error(
        'Load Failed',
        getErrorMessage(error, 'Could not load governance configuration.'),
      );
    } finally {
      this.loading = false;
    }
  }
}
