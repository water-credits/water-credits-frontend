import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, X, Filter, RotateCcw } from 'lucide-angular';

export interface FilterOption {
  key: string;
  label: string;
  type: 'select' | 'text' | 'range';
  options?: { value: string; label: string }[];
  value: string | number | { min?: number; max?: number };
}

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, LucideAngularModule],
  template: `
    <div
      class="bg-white dark:bg-dark-bg-lighter rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
    >
      <div
        class="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700"
      >
        <div class="flex items-center gap-2">
          <lucide-angular [img]="FilterIcon" class="w-4 h-4 text-stellar-blue"></lucide-angular>
          <h4 class="font-medium text-sm">Filters</h4>
        </div>
        <button
          (click)="reset.emit()"
          class="text-xs text-stellar-blue hover:text-stellar-blue-light flex items-center gap-1"
        >
          <lucide-angular [img]="RotateCcwIcon" class="w-3 h-3"></lucide-angular>
          Reset
        </button>
      </div>
      <div class="p-4 space-y-4">
        <div *ngFor="let filter of filters" class="space-y-1.5">
          <label class="label">{{ filter.label }}</label>
          <select
            *ngIf="filter.type === 'select'"
            [ngModel]="filter.value"
            (ngModelChange)="onFilterChange(filter.key, $event)"
            class="input"
          >
            <option value="">All</option>
            <option *ngFor="let opt of filter.options" [value]="opt.value">{{ opt.label }}</option>
          </select>
          <input
            *ngIf="filter.type === 'text'"
            [ngModel]="filter.value"
            (ngModelChange)="onFilterChange(filter.key, $event)"
            type="text"
            class="input"
            placeholder="Filter by {{ filter.label.toLowerCase() }}..."
          />
          <div *ngIf="filter.type === 'range'" class="flex items-center gap-2">
            <input
              [ngModel]="asRange(filter.value).min"
              (ngModelChange)="onRangeChange(filter.key, 'min', $event)"
              type="number"
              class="input"
              placeholder="Min"
            />
            <span class="text-slate-400">-</span>
            <input
              [ngModel]="asRange(filter.value).max"
              (ngModelChange)="onRangeChange(filter.key, 'max', $event)"
              type="number"
              class="input"
              placeholder="Max"
            />
          </div>
        </div>
      </div>
      <div class="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
        <button (click)="apply.emit()" class="btn btn-primary w-full text-sm">Apply Filters</button>
      </div>
    </div>
  `,
})
export class FilterPanelComponent {
  @Input() filters: FilterOption[] = [];
  @Output() filterChange = new EventEmitter<{
    key: string;
    value: string | number | { min?: number; max?: number };
  }>();
  @Output() apply = new EventEmitter<void>();
  @Output() reset = new EventEmitter<void>();

  protected readonly FilterIcon = Filter;
  protected readonly RotateCcwIcon = RotateCcw;
  protected readonly XIcon = X;

  onFilterChange(key: string, value: string | number): void {
    this.filterChange.emit({ key, value });
  }

  onRangeChange(key: string, bound: 'min' | 'max', value: number): void {
    const current = this.filters.find((f) => f.key === key)?.value || {};
    this.filterChange.emit({
      key,
      value: { ...(current as { min?: number; max?: number }), [bound]: value },
    });
  }

  asRange(value: string | number | { min?: number; max?: number }): { min?: number; max?: number } {
    if (typeof value === 'object' && value !== null) return value as { min?: number; max?: number };
    return {};
  }
}
