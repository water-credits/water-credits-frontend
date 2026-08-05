import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  NgZone,
} from '@angular/core';
import { NgFor, NgIf, DecimalPipe, AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { Subject, Observable } from 'rxjs';
import { takeUntil, distinctUntilChanged } from 'rxjs/operators';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  ColorType,
  CrosshairMode,
  LineStyle,
} from 'lightweight-charts';
import { LucideAngularModule, TrendingUp, TrendingDown, Minus } from 'lucide-angular';

import { AppState } from '../../../core/store/app.state';
import * as MarketplaceActions from '../../../core/store/marketplace/marketplace.actions';
import {
  selectPriceHistory,
  selectPriceChartRange,
  selectPriceHistoryLoading,
  selectOrderBook,
} from '../../../core/store/marketplace/marketplace.selectors';
import { OhlcCandle, OrderBook, OrderBookEntry, PriceChartTimeRange } from '../../../core/models/marketplace.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';

/** Aggregated bid or ask level for the depth chart. */
interface DepthPoint {
  price: number;
  /** Cumulative volume up to this price level. */
  cumVolume: number;
  side: 'bid' | 'ask';
}

const TIME_RANGES: PriceChartTimeRange[] = ['1H', '6H', '24H', '7D', '30D'];

@Component({
  selector: 'app-marketplace-price-chart',
  standalone: true,
  imports: [NgFor, NgIf, AsyncPipe, DecimalPipe, LucideAngularModule, LoadingSpinnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <!-- ── Header ─────────────────────────────────────────────────────── -->
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div class="flex items-center gap-3">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-white">Price Chart</h2>
          <ng-container *ngIf="lastCandle">
            <span class="text-2xl font-mono font-bold"
              [class.text-green-500]="priceDirection === 'up'"
              [class.text-red-500]="priceDirection === 'down'"
              [class.text-slate-400]="priceDirection === 'flat'"
            >
              {{ lastCandle.close | number:'1.4-4' }} XLM
            </span>
            <span class="flex items-center gap-1 text-sm"
              [class.text-green-500]="priceDirection === 'up'"
              [class.text-red-500]="priceDirection === 'down'"
              [class.text-slate-400]="priceDirection === 'flat'"
            >
              <lucide-angular *ngIf="priceDirection === 'up'" [img]="TrendingUpIcon" class="w-4 h-4"></lucide-angular>
              <lucide-angular *ngIf="priceDirection === 'down'" [img]="TrendingDownIcon" class="w-4 h-4"></lucide-angular>
              <lucide-angular *ngIf="priceDirection === 'flat'" [img]="MinusIcon" class="w-4 h-4"></lucide-angular>
              {{ priceChangePct | number:'1.2-2' }}%
            </span>
          </ng-container>
        </div>

        <!-- Time range selector -->
        <div class="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          <button
            *ngFor="let r of timeRanges"
            (click)="selectRange(r)"
            [class.bg-white]="activeRange === r"
            [class.shadow-sm]="activeRange === r"
            [class.text-slate-900]="activeRange === r"
            [class.text-slate-500]="activeRange !== r"
            class="px-3 py-1 text-xs font-medium rounded-md transition-all dark:text-white"
            [attr.aria-pressed]="activeRange === r"
            [attr.aria-label]="r + ' time range'"
          >{{ r }}</button>
        </div>
      </div>

      <!-- ── Candlestick chart ───────────────────────────────────────────── -->
      <div
        class="bg-white dark:bg-dark-bg-lighter rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden relative"
      >
        <div *ngIf="loading$ | async" class="absolute inset-0 z-10 flex items-center justify-center bg-white/70 dark:bg-black/40">
          <app-loading-spinner size="md" label="Loading price history..."></app-loading-spinner>
        </div>
        <div
          #candleChartContainer
          class="w-full"
          style="height: 320px;"
          role="img"
          aria-label="Candlestick price chart"
        ></div>
      </div>

      <!-- ── Depth chart ─────────────────────────────────────────────────── -->
      <div
        class="bg-white dark:bg-dark-bg-lighter rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
      >
        <div class="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-300">Market Depth</h3>
        </div>
        <div
          #depthChartContainer
          class="w-full"
          style="height: 200px;"
          role="img"
          aria-label="Market depth chart"
        ></div>
      </div>

      <!-- ── OHLC summary strip ──────────────────────────────────────────── -->
      <div
        *ngIf="lastCandle"
        class="grid grid-cols-2 sm:grid-cols-4 gap-3"
        aria-label="OHLC price summary"
      >
        <div class="bg-white dark:bg-dark-bg-lighter rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3">
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Open</p>
          <p class="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">{{ lastCandle.open | number:'1.4-4' }}</p>
        </div>
        <div class="bg-white dark:bg-dark-bg-lighter rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3">
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">High</p>
          <p class="font-mono text-sm font-semibold text-green-600 dark:text-green-400">{{ lastCandle.high | number:'1.4-4' }}</p>
        </div>
        <div class="bg-white dark:bg-dark-bg-lighter rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3">
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Low</p>
          <p class="font-mono text-sm font-semibold text-red-600 dark:text-red-400">{{ lastCandle.low | number:'1.4-4' }}</p>
        </div>
        <div class="bg-white dark:bg-dark-bg-lighter rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3">
          <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Volume</p>
          <p class="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">{{ lastCandle.volume | number:'1.0-0' }}</p>
        </div>
      </div>
    </div>
  `,
})
export class MarketplacePriceChartComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  /** Project ID to load price history for. */
  @Input() projectId = '';

  @ViewChild('candleChartContainer') candleContainerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('depthChartContainer') depthContainerRef!: ElementRef<HTMLDivElement>;

  protected readonly TrendingUpIcon = TrendingUp;
  protected readonly TrendingDownIcon = TrendingDown;
  protected readonly MinusIcon = Minus;
  protected readonly timeRanges = TIME_RANGES;

  protected activeRange: PriceChartTimeRange = '24H';
  protected lastCandle: OhlcCandle | null = null;
  protected priceDirection: 'up' | 'down' | 'flat' = 'flat';
  protected priceChangePct = 0;
  protected loading$!: Observable<boolean>;

  private destroy$ = new Subject<void>();
  private viewReady = false;

  // lightweight-charts instances
  private candleChart: IChartApi | null = null;
  private candleSeries: ISeriesApi<'Candlestick'> | null = null;
  private depthChart: IChartApi | null = null;
  private bidSeries: ISeriesApi<'Area'> | null = null;
  private askSeries: ISeriesApi<'Area'> | null = null;

  // ResizeObserver for responsive charts
  private resizeObserver: ResizeObserver | null = null;

  constructor(
    private store: Store<AppState>,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
  ) {
    // Initialize after store is injected
    this.loading$ = this.store.select(selectPriceHistoryLoading);
  }

  ngOnInit(): void {
    this.store.select(selectPriceChartRange)
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((range) => {
        this.activeRange = range;
        this.cdr.markForCheck();
      });

    // React to price history changes and update the candle chart
    this.store.select(selectPriceHistory)
      .pipe(takeUntil(this.destroy$))
      .subscribe((candles) => {
        this.updateCandleChart(candles);
        if (candles.length) {            const last = candles[candles.length - 1];
            const first = candles[0];
            this.lastCandle = last;
            const change = last.close - first.open;
          this.priceChangePct = first.open !== 0 ? (change / first.open) * 100 : 0;
          this.priceDirection = change > 0 ? 'up' : change < 0 ? 'down' : 'flat';
        } else {
          this.lastCandle = null;
          this.priceChangePct = 0;
          this.priceDirection = 'flat';
        }
        this.cdr.markForCheck();
      });

    // React to order book changes and update the depth chart
    this.store.select(selectOrderBook)
      .pipe(takeUntil(this.destroy$))
      .subscribe((orderBook) => {
        if (orderBook) this.updateDepthChart(orderBook);
      });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.initCandleChart();
    this.initDepthChart();

    // Load initial data if projectId was already set via Input
    if (this.projectId) {
      this.dispatchLoadPriceHistory();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projectId'] && this.viewReady && this.projectId) {
      this.dispatchLoadPriceHistory();
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.candleChart?.remove();
    this.depthChart?.remove();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Public actions ────────────────────────────────────────────────────────

  selectRange(range: PriceChartTimeRange): void {
    if (range === this.activeRange) return;
    this.store.dispatch(MarketplaceActions.setPriceChartRange({ range }));
    this.store.dispatch(
      MarketplaceActions.loadPriceHistory({ projectId: this.projectId, range }),
    );
  }

  // ── Chart initialisation ──────────────────────────────────────────────────

  private initCandleChart(): void {
    const container = this.candleContainerRef?.nativeElement;
    if (!container) return;

    this.zone.runOutsideAngular(() => {
      this.candleChart = createChart(container, {
        ...this.chartBaseOptions(container),
        rightPriceScale: { borderVisible: false },
        timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false },
        crosshair: { mode: CrosshairMode.Normal },
      });

      this.candleSeries = this.candleChart.addCandlestickSeries({
        upColor: '#30D158',
        downColor: '#FF453A',
        borderVisible: false,
        wickUpColor: '#30D158',
        wickDownColor: '#FF453A',
      });

      this.attachResizeObserver(container, this.candleChart);
    });
  }

  private initDepthChart(): void {
    const container = this.depthContainerRef?.nativeElement;
    if (!container) return;

    this.zone.runOutsideAngular(() => {
      this.depthChart = createChart(container, {
        ...this.chartBaseOptions(container),
        rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.1, bottom: 0 } },
        timeScale: { visible: false },
        crosshair: { mode: CrosshairMode.Magnet },
      });

      this.bidSeries = this.depthChart.addAreaSeries({
        lineColor: '#30D158',
        topColor: '#30D15840',
        bottomColor: '#30D15800',
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });

      this.askSeries = this.depthChart.addAreaSeries({
        lineColor: '#FF453A',
        topColor: '#FF453A40',
        bottomColor: '#FF453A00',
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });

      this.attachResizeObserver(container, this.depthChart);
    });
  }

  private chartBaseOptions(container: HTMLDivElement): Parameters<typeof createChart>[1] {
    return {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#94A3B8',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#38383A20', style: LineStyle.Dotted },
        horzLines: { color: '#38383A20', style: LineStyle.Dotted },
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    };
  }

  // ── Chart updates ─────────────────────────────────────────────────────────

  private updateCandleChart(candles: OhlcCandle[]): void {
    if (!this.candleSeries) return;
    this.zone.runOutsideAngular(() => {
      const data: CandlestickData[] = candles.map((c) => ({
        time: c.time as CandlestickData['time'],
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));
      this.candleSeries!.setData(data);
      if (data.length) this.candleChart?.timeScale().fitContent();
    });
  }

  private updateDepthChart(orderBook: OrderBook): void {
    if (!this.bidSeries || !this.askSeries) return;

    const bidPoints = this.buildDepthPoints(orderBook.bids, 'bid');
    const askPoints = this.buildDepthPoints(orderBook.asks, 'ask');

    if (!bidPoints.length && !askPoints.length) return;

    // Use unix timestamp of "now" as fake x-axis since lightweight-charts
    // requires a time field. Depth chart has the time scale hidden.
    const now = Math.floor(Date.now() / 1000);

    this.zone.runOutsideAngular(() => {
      // Bids: sorted descending by price → reverse to ascending for area chart
      const bidData = [...bidPoints]
        .sort((a, b) => a.price - b.price)
        .map((p, i) => ({ time: (now + i) as CandlestickData['time'], value: p.cumVolume }));

      // Asks: sorted ascending by price
      const askData = [...askPoints]
        .sort((a, b) => a.price - b.price)
        .map((p, i) => ({ time: (now + i) as CandlestickData['time'], value: p.cumVolume }));

      if (bidData.length) this.bidSeries!.setData(bidData);
      if (askData.length) this.askSeries!.setData(askData);

      this.depthChart?.timeScale().fitContent();
    });
  }

  /**
   * Builds cumulative depth points from order book entries.
   * Bids are sorted descending (best bid first) for cumulative sum.
   * Asks are sorted ascending (best ask first) for cumulative sum.
   */
  buildDepthPoints(entries: OrderBookEntry[], side: 'bid' | 'ask'): DepthPoint[] {
    if (!entries.length) return [];

    const sorted =
      side === 'bid'
        ? [...entries].sort((a, b) => b.price - a.price) // desc
        : [...entries].sort((a, b) => a.price - b.price); // asc

    let cumVolume = 0;
    return sorted.map((entry) => {
      cumVolume += parseFloat(entry.amount || '0');
      return { price: entry.price, cumVolume, side };
    });
  }

  // ── Store dispatch ────────────────────────────────────────────────────────

  private dispatchLoadPriceHistory(): void {
    this.store.dispatch(
      MarketplaceActions.loadPriceHistory({ projectId: this.projectId, range: this.activeRange }),
    );
  }

  // ── Resize observer ───────────────────────────────────────────────────────

  private attachResizeObserver(container: HTMLDivElement, chart: IChartApi): void {
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        chart.applyOptions({ width: entry.contentRect.width });
      }
    });
    ro.observe(container);
    if (!this.resizeObserver) {
      this.resizeObserver = ro;
    }
  }
}
