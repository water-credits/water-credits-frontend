import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { map, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { LucideAngularModule, ArrowLeft, TrendingUp, TrendingDown } from 'lucide-angular';
import { OrderBook, OrderBookEntry } from '../../../core/services/marketplace.service';
import { AppState } from '../../../core/store/app.state';
import * as MarketplaceActions from '../../../core/store/marketplace/marketplace.actions';
import {
  selectOrderBook,
  selectMarketplaceLoading,
} from '../../../core/store/marketplace/marketplace.selectors';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';
import { CreditAmountPipe } from '../../../shared/pipes/credit-amount.pipe';

@Component({
  selector: 'app-marketplace-order-book',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    AsyncPipe,
    RouterLink,
    LucideAngularModule,
    LoadingSpinnerComponent,
    CreditAmountPipe,
  ],
  template: `
    <div class="space-y-6">
      <div class="flex items-center gap-4">
        <a routerLink="/marketplace" class="btn btn-ghost btn-sm">
          <lucide-angular [img]="ArrowLeftIcon" class="w-4 h-4"></lucide-angular>
          Back to Marketplace
        </a>
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Order Book</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Project ID: {{ projectId }}</p>
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

      <ng-container *ngIf="!(loading$ | async) && projectId && (orderBook$ | async) as orderBook">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              </div>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr
                    class="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-dark-bg"
                  >
                    <th
                      class="px-4 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase w-1/3"
                    >
                      Price (XLM)
                    </th>
                    <th
                      class="px-4 py-2 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase"
                    >
                      Amount
                    </th>
                    <th
                      class="px-4 py-2 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase"
                    >
                      Total
                    </th>
                    <th
                      class="px-4 py-2 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase"
                    >
                      Orders
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    *ngFor="let ask of orderBook.asks"
                    class="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td class="px-4 py-2 text-sm font-mono text-red-600 dark:text-red-400 relative">
                      <div
                        class="absolute inset-y-0 left-0 bg-red-200/60 dark:bg-red-900/30 rounded-r"
                        [style.width.%]="getDepthPercent(ask, orderBook.asks)"
                      ></div>
                      <span class="relative z-10 pl-1">{{ ask.price }}</span>
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
              </div>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr
                    class="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-dark-bg"
                  >
                    <th
                      class="px-4 py-2 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase w-1/3"
                    >
                      Price (XLM)
                    </th>
                    <th
                      class="px-4 py-2 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase"
                    >
                      Amount
                    </th>
                    <th
                      class="px-4 py-2 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase"
                    >
                      Total
                    </th>
                    <th
                      class="px-4 py-2 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase"
                    >
                      Orders
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    *ngFor="let bid of orderBook.bids"
                    class="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td
                      class="px-4 py-2 text-sm font-mono text-green-600 dark:text-green-400 relative"
                    >
                      <div
                        class="absolute inset-y-0 left-0 bg-green-200/60 dark:bg-green-900/30 rounded-r"
                        [style.width.%]="getDepthPercent(bid, orderBook.bids)"
                      ></div>
                      <span class="relative z-10 pl-1">{{ bid.price }}</span>
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
    </div>
  `,
})
export class MarketplaceOrderBookComponent implements OnInit, OnDestroy {
  protected readonly ArrowLeftIcon = ArrowLeft;
  protected readonly TrendingUpIcon = TrendingUp;
  protected readonly TrendingDownIcon = TrendingDown;

  protected projectId = '';
  protected orderBook$: Observable<OrderBook | null>;
  protected loading$: Observable<boolean>;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private store: Store<AppState>,
  ) {
    this.orderBook$ = this.store.select(selectOrderBook);
    this.loading$ = this.store.select(selectMarketplaceLoading);
  }

  ngOnInit(): void {
    // React to route param changes reactively.
    this.route.paramMap
      .pipe(
        map((params) => params.get('projectId') ?? ''),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe((projectId) => {
        this.projectId = projectId;
        if (projectId) {
          this.store.dispatch(MarketplaceActions.loadOrderBook({ projectId }));
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getDepthPercent(entry: OrderBookEntry, entries: OrderBookEntry[]): number {
    if (!entries.length) return 0;
    const maxTotal = Math.max(...entries.map((e) => parseFloat(e.total || '0')));
    if (maxTotal === 0) return 0;
    return (parseFloat(entry.total || '0') / maxTotal) * 100;
  }
}
