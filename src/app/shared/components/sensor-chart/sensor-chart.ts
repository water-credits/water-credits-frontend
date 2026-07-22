import {
  Component,
  Input,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  AfterViewInit,
  inject,
} from '@angular/core';
import { NgFor } from '@angular/common';
import { Store } from '@ngrx/store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { AppState } from '../../../core/store/app.state';
import { selectIsDarkMode } from '../../../core/store/ui/ui.selectors';

Chart.register(...registerables);

export interface ChartSeries {
  label: string;
  data: { x: number; y: number }[];
  color?: string;
}

/**
 * Chart.js color tokens that adapt to the active theme.
 * Values mirror the CSS custom properties defined in styles.scss.
 */
function getChartColors(isDark: boolean): {
  grid: string;
  tick: string;
  legend: string;
} {
  return isDark
    ? { grid: '#334155', tick: '#94a3b8', legend: '#cbd5e1' }
    : { grid: '#e2e8f0', tick: '#64748b', legend: '#475569' };
}

@Component({
  selector: 'app-sensor-chart',
  standalone: true,
  imports: [NgFor],
  template: `
    <div
      class="bg-white dark:bg-dark-bg-lighter rounded-xl border border-slate-200 dark:border-slate-700 p-4"
    >
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300">{{ title }}</h3>
        <div class="flex items-center gap-3">
          <button
            *ngFor="let range of timeRanges"
            (click)="selectRange(range)"
            [class]="{
              'bg-stellar-blue text-white': selectedRange === range,
              'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700': selectedRange !== range,
            }"
            class="px-2 py-1 text-xs rounded-md transition-colors"
          >
            {{ range }}
          </button>
        </div>
      </div>
      <div class="relative" style="height: {{ height }}px">
        <canvas #chartCanvas></canvas>
      </div>
    </div>
  `,
})
export class SensorChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() title = 'Sensor Readings';
  @Input() series: ChartSeries[] = [];
  @Input() height = 300;
  @Input() timeRanges: string[] = ['1H', '6H', '24H', '7D', '30D'];

  @ViewChild('chartCanvas') canvas!: ElementRef<HTMLCanvasElement>;

  private readonly store = inject(Store<AppState>);
  private readonly destroyRef = inject(DestroyRef);

  private chart: Chart | null = null;
  private isDark = true;

  protected selectedRange = '24H';

  constructor() {
    // Subscribe to theme changes and rebuild the chart with updated colors.
    this.store
      .select(selectIsDarkMode)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((dark) => {
        this.isDark = dark;
        // Rebuild if the chart has already been created (theme changed at runtime).
        if (this.chart) {
          this.createChart();
        }
      });
  }

  ngAfterViewInit(): void {
    this.createChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Re-render when series data changes (but only after the canvas is ready).
    if (changes['series'] && this.chart) {
      this.createChart();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  selectRange(range: string): void {
    this.selectedRange = range;
    this.createChart();
  }

  private createChart(): void {
    this.chart?.destroy();
    const ctx = this.canvas?.nativeElement.getContext('2d');
    if (!ctx) return;

    const colors = getChartColors(this.isDark);

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        datasets: this.series.map((s) => ({
          label: s.label,
          data: s.data.map((d) => ({ x: d.x, y: d.y })),
          borderColor: s.color || '#7B2FBE',
          backgroundColor: s.color ? `${s.color}20` : '#7B2FBE20',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 2,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: {
            display: this.series.length > 1,
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 16,
              usePointStyle: true,
              color: colors.legend,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: colors.tick, maxTicksLimit: 10 },
          },
          y: {
            beginAtZero: true,
            grid: { color: colors.grid },
            ticks: { color: colors.tick },
          },
        },
      },
    };

    this.chart = new Chart(ctx, config);
  }
}
