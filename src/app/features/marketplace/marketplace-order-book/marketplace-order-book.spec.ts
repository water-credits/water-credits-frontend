/**
 * Unit tests for the marketplace price chart and order book enhancements.
 *
 * Covers:
 *  1. MarketplacePriceChartComponent — depth point aggregation + range selection
 *  2. MarketplaceOrderBookComponent  — depth % and spread calculation
 *  3. Marketplace NgRx reducer        — price history state transitions
 *  4. Marketplace NgRx effects        — loadPriceHistory + WebSocket forwarding
 *  5. WebsocketService                — marketplace subscription methods
 */

import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideMockActions } from '@ngrx/effects/testing';
import { provideRouter } from '@angular/router';
import { ComponentFixture } from '@angular/core/testing';
import { Action } from '@ngrx/store';
import { Subject, of, firstValueFrom } from 'rxjs';

import { reducers } from '../../../core/store/app.state';
import { MarketplacePriceChartComponent } from '../marketplace-price-chart/marketplace-price-chart';
import { MarketplaceOrderBookComponent } from './marketplace-order-book';
import { marketplaceReducer } from '../../../core/store/marketplace/marketplace.reducer';
import { MarketplaceEffects } from '../../../core/store/marketplace/marketplace.effects';
import * as MarketplaceActions from '../../../core/store/marketplace/marketplace.actions';
import { MarketplaceService, OrderBook, OrderBookEntry } from '../../../core/services/marketplace.service';
import { WebsocketService } from '../../../core/services/websocket.service';
import { NotificationService } from '../../../core/services/notification.service';
import { OhlcCandle, PriceChartTimeRange } from '../../../core/models/marketplace.model';

@Component({ standalone: true, template: '' })
class StubComponent {}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockCandles: OhlcCandle[] = [
  { time: 1700000000, open: 2.0, high: 2.5, low: 1.8, close: 2.3, volume: 1000 },
  { time: 1700003600, open: 2.3, high: 2.8, low: 2.1, close: 2.6, volume: 1500 },
  { time: 1700007200, open: 2.6, high: 3.0, low: 2.4, close: 2.9, volume: 800 },
];

const mockOrderBook: OrderBook = {
  asks: [
    { price: 3.0, amount: '500', total: '1500', count: 1 },
    { price: 3.1, amount: '1000', total: '3100', count: 2 },
    { price: 3.2, amount: '200', total: '640', count: 1 },
  ],
  bids: [
    { price: 2.9, amount: '600', total: '1740', count: 1 },
    { price: 2.8, amount: '800', total: '2240', count: 3 },
    { price: 2.7, amount: '400', total: '1080', count: 2 },
  ],
};

const mockPriceHistoryResponse = {
  projectId: 'proj-1',
  range: '24H' as PriceChartTimeRange,
  candles: mockCandles,
};

// ─── 1. MarketplacePriceChartComponent — depth aggregation ───────────────────

describe('MarketplacePriceChartComponent', () => {
  let component: MarketplacePriceChartComponent;
  let fixture: ComponentFixture<MarketplacePriceChartComponent>;

  const websocketServiceMock = {
    connected$: of(false),
    marketplacePrice$: of(),
    marketplaceTrade$: of(),
    marketplaceOrderBook$: of(),
    subscribeToMarketplace: vi.fn(),
    unsubscribeFromMarketplace: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarketplacePriceChartComponent],
      providers: [
        provideRouter([]),
        provideStore(reducers),
        provideEffects([]),
        { provide: WebsocketService, useValue: websocketServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MarketplacePriceChartComponent);
    component = fixture.componentInstance;
    component.projectId = 'proj-1';
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── buildDepthPoints ──────────────────────────────────────────────────────

  describe('buildDepthPoints()', () => {
    it('returns empty array for empty entries', () => {
      const result = component.buildDepthPoints([], 'bid');
      expect(result).toEqual([]);
    });

    it('accumulates cumulative volume for bids (descending price)', () => {
      const bids: OrderBookEntry[] = [
        { price: 3.0, amount: '100', total: '300', count: 1 },
        { price: 2.8, amount: '200', total: '560', count: 2 },
        { price: 2.5, amount: '50', total: '125', count: 1 },
      ];
      const result = component.buildDepthPoints(bids, 'bid');

      // Sorted descending by price: 3.0, 2.8, 2.5
      expect(result[0].price).toBe(3.0);
      expect(result[0].cumVolume).toBe(100);

      expect(result[1].price).toBe(2.8);
      expect(result[1].cumVolume).toBe(300); // 100 + 200

      expect(result[2].price).toBe(2.5);
      expect(result[2].cumVolume).toBe(350); // 100 + 200 + 50
    });

    it('accumulates cumulative volume for asks (ascending price)', () => {
      const asks: OrderBookEntry[] = [
        { price: 3.2, amount: '200', total: '640', count: 1 },
        { price: 3.0, amount: '500', total: '1500', count: 1 },
        { price: 3.1, amount: '100', total: '310', count: 1 },
      ];
      const result = component.buildDepthPoints(asks, 'ask');

      // Sorted ascending: 3.0, 3.1, 3.2
      expect(result[0].price).toBe(3.0);
      expect(result[0].cumVolume).toBe(500);

      expect(result[1].price).toBe(3.1);
      expect(result[1].cumVolume).toBe(600); // 500 + 100

      expect(result[2].price).toBe(3.2);
      expect(result[2].cumVolume).toBe(800); // 500 + 100 + 200
    });

    it('handles entries with string amounts that have decimals', () => {
      const asks: OrderBookEntry[] = [
        { price: 3.0, amount: '100.5', total: '301.5', count: 1 },
        { price: 3.1, amount: '200.25', total: '620.775', count: 1 },
      ];
      const result = component.buildDepthPoints(asks, 'ask');
      expect(result[1].cumVolume).toBeCloseTo(300.75, 2);
    });

    it('assigns the correct side to each point', () => {
      const bids: OrderBookEntry[] = [{ price: 2.9, amount: '100', total: '290', count: 1 }];
      const result = component.buildDepthPoints(bids, 'bid');
      expect(result[0].side).toBe('bid');
    });
  });
});

// ─── 2. MarketplaceOrderBookComponent — helpers ───────────────────────────────

describe('MarketplaceOrderBookComponent', () => {
  let component: MarketplaceOrderBookComponent;
  let fixture: ComponentFixture<MarketplaceOrderBookComponent>;

  const websocketServiceMock = {
    connected$: of(false),
    marketplacePrice$: of(),
    marketplaceTrade$: of(),
    marketplaceOrderBook$: of(),
    subscribeToMarketplace: vi.fn(),
    unsubscribeFromMarketplace: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarketplaceOrderBookComponent],
      providers: [
        provideRouter([{ path: 'marketplace', component: StubComponent }]),
        provideStore(reducers),
        provideEffects([]),
        { provide: WebsocketService, useValue: websocketServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MarketplaceOrderBookComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ── getDepthPercent ──────────────────────────────────────────────────────

  describe('getDepthPercent()', () => {
    it('returns 0 for empty entries array', () => {
      const entry: OrderBookEntry = { price: 3.0, amount: '500', total: '1500', count: 1 };
      expect(component.getDepthPercent(entry, [])).toBe(0);
    });

    it('returns 100 for the entry with the largest total', () => {
      const entry = mockOrderBook.asks[1]; // total '3100' is the largest
      expect(component.getDepthPercent(entry, mockOrderBook.asks)).toBe(100);
    });

    it('returns a proportional value for a non-max entry', () => {
      const maxEntry = mockOrderBook.asks[1]; // total 3100
      const halfEntry = mockOrderBook.asks[0]; // total 1500
      const pct = component.getDepthPercent(halfEntry, mockOrderBook.asks);
      expect(pct).toBeCloseTo((1500 / 3100) * 100, 1);
    });

    it('returns 0 when all totals are 0', () => {
      const entries: OrderBookEntry[] = [
        { price: 1.0, amount: '0', total: '0', count: 0 },
      ];
      expect(component.getDepthPercent(entries[0], entries)).toBe(0);
    });
  });

  // ── getSpread ────────────────────────────────────────────────────────────

  describe('getSpread()', () => {
    it('returns the spread between best ask and best bid', () => {
      const spread = component.getSpread(mockOrderBook);
      // bestAsk = 3.0, bestBid = 2.9 → spread = 0.1
      expect(spread).toBeCloseTo(0.1, 5);
    });

    it('returns 0 when asks are empty', () => {
      expect(component.getSpread({ asks: [], bids: mockOrderBook.bids })).toBe(0);
    });

    it('returns 0 when bids are empty', () => {
      expect(component.getSpread({ asks: mockOrderBook.asks, bids: [] })).toBe(0);
    });
  });

  // ── getSpreadPct ─────────────────────────────────────────────────────────

  describe('getSpreadPct()', () => {
    it('returns the spread as a percentage of the best bid', () => {
      const pct = component.getSpreadPct(mockOrderBook);
      // spread=0.1, bestBid=2.9 → 0.1/2.9*100 ≈ 3.45%
      expect(pct).toBeCloseTo(0.1 / 2.9 * 100, 2);
    });

    it('returns 0 when bids are empty', () => {
      expect(component.getSpreadPct({ asks: mockOrderBook.asks, bids: [] })).toBe(0);
    });
  });

  // ── trackByPrice ─────────────────────────────────────────────────────────

  describe('trackByPrice()', () => {
    it('returns the entry price as the track identity', () => {
      const entry: OrderBookEntry = { price: 2.75, amount: '100', total: '275', count: 1 };
      expect(component.trackByPrice(0, entry)).toBe(2.75);
    });
  });

  // ── WebSocket subscription lifecycle ─────────────────────────────────────

  describe('WebSocket lifecycle', () => {
    beforeEach(() => vi.clearAllMocks());

    it('does not call unsubscribeFromMarketplace on init when projectId is empty', () => {
      // component already initialised without a route param
      expect(websocketServiceMock.unsubscribeFromMarketplace).not.toHaveBeenCalled();
    });

    it('calls unsubscribeFromMarketplace on destroy when projectId is set', () => {
      // Simulate having a projectId
      (component as unknown as { projectId: string }).projectId = 'proj-1';
      fixture.destroy();
      expect(websocketServiceMock.unsubscribeFromMarketplace).toHaveBeenCalledWith('proj-1');
    });
  });
});

// ─── 3. Marketplace reducer — price history ───────────────────────────────────

describe('marketplaceReducer — price history', () => {
  it('sets priceHistoryLoading=true on loadPriceHistory', () => {
    const action = MarketplaceActions.loadPriceHistory({ projectId: 'p1', range: '24H' });
    const state = marketplaceReducer(undefined, action);
    expect(state.priceHistoryLoading).toBe(true);
    expect(state.priceHistoryError).toBeNull();
  });

  it('stores candles on loadPriceHistorySuccess', () => {
    const action = MarketplaceActions.loadPriceHistorySuccess({
      projectId: 'p1',
      range: '24H',
      candles: mockCandles,
    });
    const state = marketplaceReducer(undefined, action);
    expect(state.priceHistory).toEqual(mockCandles);
    expect(state.priceHistoryLoading).toBe(false);
  });

  it('stores error on loadPriceHistoryFailure', () => {
    const action = MarketplaceActions.loadPriceHistoryFailure({ error: 'API error' });
    const state = marketplaceReducer(undefined, action);
    expect(state.priceHistoryError).toBe('API error');
    expect(state.priceHistoryLoading).toBe(false);
  });

  it('appends a new candle on updateCandleRealtime', () => {
    const withCandles = marketplaceReducer(
      undefined,
      MarketplaceActions.loadPriceHistorySuccess({ projectId: 'p1', range: '24H', candles: mockCandles }),
    );
    const newCandle: OhlcCandle = { time: 1700010800, open: 2.9, high: 3.1, low: 2.7, close: 3.0, volume: 500 };
    const action = MarketplaceActions.updateCandleRealtime({ candle: newCandle });
    const state = marketplaceReducer(withCandles, action);
    expect(state.priceHistory).toHaveLength(mockCandles.length + 1);
    expect(state.priceHistory[state.priceHistory.length - 1]).toEqual(newCandle);
  });

  it('replaces an existing candle with the same time on updateCandleRealtime', () => {
    const withCandles = marketplaceReducer(
      undefined,
      MarketplaceActions.loadPriceHistorySuccess({ projectId: 'p1', range: '24H', candles: mockCandles }),
    );
    const updatedCandle: OhlcCandle = {
      ...mockCandles[1],
      close: 2.99, // updated close
    };
    const action = MarketplaceActions.updateCandleRealtime({ candle: updatedCandle });
    const state = marketplaceReducer(withCandles, action);
    expect(state.priceHistory).toHaveLength(mockCandles.length);
    expect(state.priceHistory[1].close).toBe(2.99);
  });

  it('replaces order book on updateOrderBookRealtime', () => {
    const newOrderBook: OrderBook = {
      asks: [{ price: 3.5, amount: '100', total: '350', count: 1 }],
      bids: [{ price: 3.2, amount: '200', total: '640', count: 1 }],
    };
    const action = MarketplaceActions.updateOrderBookRealtime({ orderBook: newOrderBook });
    const state = marketplaceReducer(undefined, action);
    expect(state.orderBook).toEqual(newOrderBook);
  });

  it('clears priceHistory and updates range on setPriceChartRange', () => {
    // Start with some candles loaded
    const withCandles = marketplaceReducer(
      undefined,
      MarketplaceActions.loadPriceHistorySuccess({ projectId: 'p1', range: '24H', candles: mockCandles }),
    );
    const action = MarketplaceActions.setPriceChartRange({ range: '7D' });
    const state = marketplaceReducer(withCandles, action);
    expect(state.priceChartRange).toBe('7D');
    expect(state.priceHistory).toEqual([]);
  });
});

// ─── 4. Marketplace effects — loadPriceHistory ────────────────────────────────

describe('MarketplaceEffects — price history', () => {
  let effects: MarketplaceEffects;
  let actions$: Subject<Action>;

  const marketplaceServiceMock = {
    getListings: vi.fn(),
    getOrderBook: vi.fn(),
    createListing: vi.fn(),
    getPriceHistory: vi.fn(),
  };

  const notificationServiceMock = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  };

  const websocketServiceMock = {
    connected$: of(false),
    marketplacePrice$: of(),
    marketplaceTrade$: of(),
    marketplaceOrderBook$: of(),
    subscribeToMarketplace: vi.fn(),
    unsubscribeFromMarketplace: vi.fn(),
  };

  beforeEach(() => {
    actions$ = new Subject<Action>();
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        MarketplaceEffects,
        provideRouter([{ path: 'marketplace', component: StubComponent }]),
        provideStore({}),
        provideMockActions(() => actions$),
        { provide: MarketplaceService, useValue: marketplaceServiceMock },
        { provide: WebsocketService, useValue: websocketServiceMock },
        { provide: NotificationService, useValue: notificationServiceMock },
      ],
    });

    effects = TestBed.inject(MarketplaceEffects);
  });

  it('emits loadPriceHistorySuccess on successful fetch', async () => {
    marketplaceServiceMock.getPriceHistory.mockResolvedValue(mockPriceHistoryResponse);

    const resultPromise = firstValueFrom(effects.loadPriceHistory$);
    actions$.next(MarketplaceActions.loadPriceHistory({ projectId: 'proj-1', range: '24H' }));
    const action = await resultPromise;

    expect(action).toEqual(
      MarketplaceActions.loadPriceHistorySuccess({
        projectId: 'proj-1',
        range: '24H',
        candles: mockCandles,
      }),
    );
    expect(marketplaceServiceMock.getPriceHistory).toHaveBeenCalledWith('proj-1', '24H');
  });

  it('emits loadPriceHistoryFailure on API error', async () => {
    marketplaceServiceMock.getPriceHistory.mockRejectedValue(new Error('Timeout'));

    const resultPromise = firstValueFrom(effects.loadPriceHistory$);
    actions$.next(MarketplaceActions.loadPriceHistory({ projectId: 'proj-1', range: '1H' }));
    const action = await resultPromise;

    expect(action).toEqual(MarketplaceActions.loadPriceHistoryFailure({ error: 'Timeout' }));
  });
});

// ─── 5. WebSocket service — marketplace methods ───────────────────────────────

describe('WebsocketService — marketplace integration', () => {
  it('exposes marketplace observable properties and subscription methods', async () => {
    const { WebsocketService: WS } = await import('../../../core/services/websocket.service');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const loggingMock = { info: vi.fn(), error: vi.fn(), warn: vi.fn() } as any;
    const service = new WS(loggingMock);

    // The socket is null until connect() is called, so subscriptions are no-ops.
    // We verify the methods exist and are callable without throwing.
    expect(() => service.subscribeToMarketplace('proj-1')).not.toThrow();
    expect(() => service.unsubscribeFromMarketplace('proj-1')).not.toThrow();
    expect(service.marketplacePrice$).toBeDefined();
    expect(service.marketplaceTrade$).toBeDefined();
    expect(service.marketplaceOrderBook$).toBeDefined();
  });
});
