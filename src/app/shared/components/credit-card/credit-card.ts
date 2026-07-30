import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';
import { StatusBadgeComponent } from '../status-badge/status-badge';
import { CreditAmountPipe } from '../../pipes/credit-amount.pipe';
import { ProjectStatus } from '../../../core/models/project.model';
import { LucideAngularModule, Droplets, TrendingUp, MapPin } from 'lucide-angular';

@Component({
  selector: 'app-credit-card',
  standalone: true,
  imports: [NgIf, StatusBadgeComponent, CreditAmountPipe, LucideAngularModule],
  template: `
    <div class="card hover:shadow-lg transition-shadow cursor-pointer" (click)="onClick()">
      <div class="p-5">
        <div class="flex items-start justify-between mb-3">
          <div>
            <h3 class="font-semibold text-slate-900 dark:text-white mb-1">
              {{ project?.name || 'Project' }}
            </h3>
            <app-status-badge [status]="project?.status || ''"></app-status-badge>
          </div>
          <div class="w-10 h-10 rounded-lg bg-stellar-blue/10 flex items-center justify-center">
            <lucide-angular [img]="DropletsIcon" class="w-5 h-5 text-stellar-blue" aria-hidden="true"></lucide-angular>
          </div>
        </div>
        <div
          *ngIf="showLocation"
          class="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mb-3"
        >
          <lucide-angular [img]="MapPinIcon" class="w-3 h-3" aria-hidden="true"></lucide-angular>
          <span>{{ project?.latitude?.toFixed(4) }}, {{ project?.longitude?.toFixed(4) }}</span>
        </div>
        <div class="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p class="text-xs text-slate-500 dark:text-slate-400">Balance</p>
            <p class="text-lg font-bold text-environmental-green">{{ balance | creditAmount }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-500 dark:text-slate-400">Price</p>
            <p class="text-lg font-bold text-credit-gold">{{ price ? '$' + price : 'N/A' }}</p>
          </div>
        </div>
        <div
          class="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700"
        >
          <div class="flex items-center gap-1 text-xs text-slate-500">
            <lucide-angular [img]="TrendingUpIcon" class="w-3 h-3" aria-hidden="true"></lucide-angular>
            <span>{{ retired | creditAmount }} retired</span>
          </div>
          <span class="text-xs text-slate-400">{{ area }} ha</span>
        </div>
      </div>
    </div>
  `,
})
export class CreditCardComponent {
  @Input() project?: {
    name?: string;
    status?: ProjectStatus | string;
    latitude?: number;
    longitude?: number;
    areaHectares?: number;
  };
  @Input() balance: string | number = '0';
  @Input() price = 0;
  @Input() retired: string | number = '0';
  @Input() area = 0;
  @Input() showLocation = true;

  protected readonly DropletsIcon = Droplets;
  protected readonly TrendingUpIcon = TrendingUp;
  protected readonly MapPinIcon = MapPin;

  onClick(): void {}
}
