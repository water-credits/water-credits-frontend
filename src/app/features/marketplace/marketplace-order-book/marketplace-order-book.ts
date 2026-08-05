import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgIf, NgFor, AsyncPipe, DecimalPipe } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { map, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { LucideAngularModule, ArrowLeft, TrendingUp, TrendingDown, Wifi, WifiOff } from 'lucide-angular';
import { OrderBook, OrderBookEntry } from '../../../core/services/marketplace.service';
import { AppState } from '../../../core/store/app.state';
import * as MarketplaceActions from '../../../core/store/marketplace/marketplace.actions';
import {
  selectOrderBook,
  selectMarketplaceLoading,
} from '../../../core/store/marketplace/marketplace.selectors';
import { WebsocketService } from '../../../core/services/websocket.service';
import { MarketplacePriceChartComponent } from '../marketplace-price-chart/marketplace-price-chart';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';
import { CreditAmountPipe } from '../../../shared/pipes/credit-amount.pipe';

@Component({
  selector: 'app-marketplace-order-book',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    AsyncPipe,
    DecimalPipe,
    RouterLink,
    LucideAngularModule,
    LoadingSpinnerComponent,
    CreditAmountPipe,
    MarketplacePriceChartComponent,
  ],
  template: `
    <div class="space-y-6">
      <!-- ── Header ──────────────────────────────────────────────────────── -->
      <div class="flex items-center gap-4 flex-wrap">
        <a routerLink="/marketplace" class="btn btn-ghost btn-sm">
          <lucide-angular [img]="ArrowLeftIcon" class="w-4 h-4"></lucide-angular>
          Back to Marketplace
        </a>
        <div class="flex-1 min-w-0">
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Order Book</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Project ID: {{ projectId }}</p>
        </div>

        <!-- Live indicator -->
        <div
          class="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
          [class.bg-green-100]="wsConnected$ | async"
          [class.dark:bg-green-900/30]="wsConnected$ | async"
          [class.text-green-700]="wsConnected$ | async"
          [class.dark:text-green-400]="wsConnected$ | async"
          [class.bg-slate-100]="!(wsConnected$ | async)"
          [class.dark:bg-slate-800]="!(wsConnected$ | async)"
          [class.text-slate-500]="!(wsConnected$ | async)"
          [attr.aria-label]="(wsConnected$ | async) ? 'Live updates active' : 'Waiting for live updates'"
        >
          <lucide-angular
            *ngIf="wsConnected$ | async"
            [img]="WifiIcon"
            class="w-3 h-3"
          ></lucide-angular>
          <lucide-angular
            *ngIf="!(wsConnected$ | async)"
            [img]="WifiOffIcon"
            class="w-3 h-3"
          ></lucide-angular>
          {{ (wsConnected$ | async) ? 'Live' : 'Offline' }}
        </div>
      </div>

      <app-loading-spinner
        *ngIf="loading$ | async"
        size="lg"
        label="Loading order book..."
      ></app-loading-spinner>

      <div *ngIf="!(loading$ | async) && !projectId" class="text-center py-16">
        <p class="text-slate-500 dark:text-slate-400">
          No project specified. Select a project to view its order book.
        </p>
      </div>

      <ng-container *ngIf="projectId">
        <!-- ── Price chart (candlestick + depth) ──────────────────────── -->
        <app-marketplace-price-chart
          [projectId]="projectId"
        ></app-marketplace-price-chart>

        <!-- ── Order book bid / ask tables ───────────────────────────── -->
        <ng-container *ngIf="!(loading$ | async) && (orderBook$ | async) as orderBook">

          <!-- Spread row -->
          <div
            *ngIf="orderBook.asks.length && orderBook.bids.length"
            class="flex items-center justify-center gap-4 text-sm"
            aria-label="Bid/ask spread"
          >
            <span class="text-green-600 dark:text-green-400 font-mono font-semibold">
              {{ orderBook.bids[0]?.price | number:'1.4-4' }}
            </span>
            <span class="text-slate-400 dark:text-slate-500">
              Spread: {{ getSpread(orderBook) | number:'1.4-4' }}
              ({{ getSpreadPct(orderBook) | number:'1.2-2' }}%)
            </span>
            <span class="text-red-600 dark:text-red-400 font-mono font-semibold">
              {{ orderBook.asks[0]?.price | number:'1.4-4' }}
            </span>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Asks -->
            <div
              class="bg-white dark:bg-dark-bg-lighter rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              <div
                class="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-red-50 dark:bg-red-900/10"
              >
                <div class="flex items-center gap-2">
                  <lucide-angular
                    [img]="TrendingDownIcon"
                    class="w-4 h-4 text-red-500"
                  ></lucide-angular>
                  <h2 class="font-semibold text-red-700 dark:text-red-400">Asks (Sell Orders)</h2>
                  <span class="ml-auto text-xs text-slate-400">{{ orderBook.asks.length }} levels</span>
                </div>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full" aria-label="Ask orders table">
                  <thead>
                    <tr
                      class="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-dark-bg"
                    >
                      <th
                        scope="col"
                        class="px-4 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase w-1/3"
                      >
                        Price (XLM)
                      </th>
                      <th
                        scope="col"
                        class="px-4 py-2 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase"
                      >
                        Amount
                      </th>
                      <th
                        scope="col"
                        class="px-4 py-2 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase"
                      >
                        Total
                      </th>
                      <th
                        scope="col"
                        class="px-4 py-2 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase"
                      >
                        Orders
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      *ngFor="let ask of orderBook.asks; trackBy: trackByPrice"
                      class="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td class="px-4 py-2 text-sm font-mono text-red-600 dark:text-red-400 relative">
                        <div
                          class="absolute inset-y-0 left-0 bg-red-200/60 dark:bg-red-900/30 rounded-r"
                          [style.width.%]="getDepthPercent(ask, orderBook.asks)"
                          aria-hidden="true"
                        ></div>
                        <span class="relative z-10 pl-1">{{ ask.price | number:'1.4-4' }}</span>
                      </td>
                      <td
                        class="px-4 py-2 text-sm font-mono text-right text-slate-700 dark:text-slate-300 relative z-10"
                      >
                        {{ ask.amount | creditAmount }}
                      </td>
                      <td
                        class="px-4 py-2 text-sm font-mono text-right text-slate-600 dark:text-slate-400 relative z-10"
                      >
                        {{ ask.total }}
                      </td>
                      <td
                        class="px-4 py-2 text-sm text-right text-slate-500 dark:text-slate-400 relative z-10"
                      >
                        {{ ask.count }}
                      </td>
                    </tr>
                    <tr *ngIf="orderBook.asks.length === 0">
                      <td colspan="4" class="px-4 py-8 text-center text-sm text-slate-400">
                        No sell orders
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Bids -->
            <div
              class="bg-white dark:bg-dark-bg-lighter rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              <div
                class="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-green-50 dark:bg-green-900/10"
              >
                <div class="flex items-center gap-2">
                  <lucide-angular
                    [img]="TrendingUpIcon"
                    class="w-4 h-4 text-green-500"
                  ></lucide-angular>
                  <h2 class="font-semibold text-green-700 dark:text-green-400">Bids (Buy Orders)</h2>
                  <span class="ml-auto text-xs text-slate-400">{{ orderBook.bids.length }} levels</span>
                </div>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full" aria-label="Bid orders table">
                  <thead>
                    <tr
                      class="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-dark-bg"
                    >
                      <th
                        scope="col"
                        class="px-4 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase w-1/3"
                      >
                        Price (XLM)
                      </th>
                      <th
                        scope="col"
                        class="px-4 py-2 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase"
                      >
                        Amount
                      </th>
                      <th
                        scope="col"
                        class="px-4 py-2 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase"
                      >
                        Total
                      </th>
                      <th
                        scope="col"
                        class="px-4 py-2 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase"
                      >
                        Orders
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      *ngFor="let bid of orderBook.bids; trackBy: trackByPrice"
                      class="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td
                        class="px-4 py-2 text-sm font-mono text-green-600 dark:text-green-400 relative"
                      >
                        <div
                          class="absolute inset-y-0 left-0 bg-green-200/60 dark:bg-green-900/30 rounded-r"
                          [style.width.%]="getDepthPercent(bid, orderBook.bids)"
                          aria-hidden="true"
                        ></div>
                        <span class="relative z-10 pl-1">{{ bid.price | number:'1.4-4' }}</span>
                      </td>
                      <td
                        class="px-4 py-2 text-sm font-mono text-right text-slate-700 dark:text-slate-300 relative z-10"
                      >
                        {{ bid.amount | creditAmount }}
                      </td>
                      <td
                        class="px-4 py-2 text-sm font-mono text-right text-slate-600 dark:text-slate-400 relative z-10"
                      >
                        {{ bid.total }}
                      </td>
                      <td
                        class="px-4 py-2 text-sm text-right text-slate-500 dark:text-slate-400 relative z-10"
                      >
                        {{ bid.count }}
                      </td>
                    </tr>
                    <tr *ngIf="orderBook.bids.length === 0">
                      <td colspan="4" class="px-4 py-8 text-center text-sm text-slate-400">
                        No buy orders
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </ng-container>
      </ng-container>
    </div>
  `,
})
export class MarketplaceOrderBookComponent implements OnInit, OnDestroy {
  protected readonly ArrowLeftIcon = ArrowLeft;
  protected readonly TrendingUpIcon = TrendingUp;
  protected readonly TrendingDownIcon = TrendingDown;
  protected readonly WifiIcon = Wifi;
  protected readonly WifiOffIcon = WifiOff;

  protected projectId = '';
  protected orderBook$: Observable<OrderBook | null>;
  protected loading$: Observable<boolean>;
  protected wsConnected$: Observable<boolean>;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private store: Store<AppState>,
    private websocketService: WebsocketService,
  ) {
    this.orderBook$ = this.store.select(selectOrderBook);
    this.loading$ = this.store.select(selectMarketplaceLoading);
    this.wsConnected$ = this.websocketService.connected$;
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => params.get('projectId') ?? ''),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe((projectId) => {
        // Unsubscribe from previous project's marketplace channel
        if (this.projectId) {
          this.websocketService.unsubscribeFromMarketplace(this.projectId);
        }

        this.projectId = projectId;

        if (projectId) {
          this.store.dispatch(MarketplaceActions.loadOrderBook({ projectId }));
          // Subscribe to live order book updates for this project
          this.websocketService.subscribeToMarketplace(projectId);
        }
      });
  }

  ngOnDestroy(): void {
    if (this.projectId) {
      this.websocketService.unsubscribeFromMarketplace(this.projectId);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Template helpers ─────────────────────────────────────────────────────

  getDepthPercent(entry: OrderBookEntry, entries: OrderBookEntry[]): number {
    if (!entries.length) return 0;
    const maxTotal = Math.max(...entries.map((e) => parseFloat(e.total || '0')));
    if (maxTotal === 0) return 0;
    return (parseFloat(entry.total || '0') / maxTotal) * 100;
  }

  getSpread(orderBook: OrderBook): number {
    if (!orderBook.asks.length || !orderBook.bids.length) return 0;
    const bestAsk = Math.min(...orderBook.asks.map((e) => e.price));
    const bestBid = Math.max(...orderBook.bids.map((e) => e.price));
    return bestAsk - bestBid;
  }

  getSpreadPct(orderBook: OrderBook): number {
    if (!orderBook.bids.length) return 0;
    const bestBid = Math.max(...orderBook.bids.map((e) => e.price));
    const spread = this.getSpread(orderBook);
    return bestBid !== 0 ? (spread / bestBid) * 100 : 0;
  }

  trackByPrice(_index: number, entry: OrderBookEntry): number {
    return entry.price;
  }
}
