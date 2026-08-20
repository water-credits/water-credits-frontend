import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange, SimpleChanges } from '@angular/core';
import { Chart } from 'chart.js';
import * as ChartModule from 'chart.js';
import { SensorReading, SensorParameterKey } from '../../../core/models/sensor-reading.model';
import { SensorChartComponent, ChartSeries } from './sensor-chart';
import { SensorParameter } from './sensor-parameter.model';

const PH_PARAM: SensorParameter = {
  key: 'ph',
  label: 'pH',
  unit: '',
  color: '#7B2FBE',
  decimals: 2,
};

const TEMP_PARAM: SensorParameter = {
  key: 'temperature',
  label: 'Temperature',
  unit: '°C',
  color: '#0EA5E9',
  decimals: 1,
};

function mkReading(
  timestamp: string,
  values: Partial<Record<SensorParameterKey, number>>,
): SensorReading {
  return {
    id: `r-${timestamp}`,
    deviceId: 'dev-1',
    projectId: 'proj-1',
    timestamp,
    signature: 'sig',
    isVerified: true,
    ...values,
  };
}

/**
 * Chart.js needs a real 2D canvas context, which JSDOM does not provide.
 * Return a Proxy-backed stub that satisfies the members Chart.js reads and
 * no-ops every drawing call.
 */
function createMock2DContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const target: Record<string | symbol, unknown> = { canvas };
  return new Proxy(target, {
    get: (obj, prop) => {
      if (prop === 'length') return 0;
      if (prop === 'measureText') return () => ({ width: 0 });
      if (prop in obj) return obj[prop];
      if (typeof prop === 'string') return () => undefined;
      return undefined;
    },
    set: () => true,
  }) as unknown as CanvasRenderingContext2D;
}

const UNIT_MS: Record<string, number> = {
  year: 365 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
  hour: 60 * 60 * 1000,
  minute: 60 * 1000,
  second: 1000,
  millisecond: 1,
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function startOfTimestamp(timestamp: number, unit: string): number {
  const d = new Date(timestamp);
  switch (unit) {
    case 'year':
      d.setMonth(0, 1);
      d.setHours(0, 0, 0, 0);
      break;
    case 'month':
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      break;
    case 'week':
      d.setDate(d.getDate() - d.getDay());
      d.setHours(0, 0, 0, 0);
      break;
    case 'day':
      d.setHours(0, 0, 0, 0);
      break;
    case 'hour':
      d.setMinutes(0, 0, 0);
      break;
    case 'minute':
      d.setSeconds(0, 0);
      break;
    case 'second':
      d.setMilliseconds(0);
      break;
    default:
      break;
  }
  return d.getTime();
}

/**
 * The new data/parameters API renders a Chart.js `time` x-scale, which
 * requires a registered date adapter. The app does not bundle one, so register
 * a minimal adapter in the test environment only.
 */
function installDateAdapter(): void {
  const adapters = (
    ChartModule as unknown as {
      _adapters: {
        _date: {
          override: (members: Record<string, unknown>) => void;
        };
      };
    }
  )._adapters;

  adapters._date.override({
    formats(): Record<string, string> {
      return {
        datetime: 'MMM d, yyyy, h:mm:ss a',
        millisecond: 'h:mm:ss.SSS a',
        second: 'h:mm:ss a',
        minute: 'h:mm a',
        hour: 'MMM d, hA',
        day: 'MMM d',
        week: 'MMM d',
        month: 'MMMM yyyy',
        quarter: 'yyyy QQQ',
        year: 'yyyy',
      };
    },
    parse(value: unknown): number | null {
      if (typeof value === 'number') return value;
      if (value instanceof Date) return value.getTime();
      if (typeof value === 'string') {
        const ts = Date.parse(value);
        return Number.isNaN(ts) ? null : ts;
      }
      return null;
    },
    format(timestamp: number, format: string): string {
      const d = new Date(timestamp);
      if (format === 'HH:mm') {
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }
      if (format === 'MMM d') {
        return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
      }
      return d.toISOString();
    },
    add(timestamp: number, amount: number, unit: string): number {
      const d = new Date(timestamp);
      switch (unit) {
        case 'year':
          d.setFullYear(d.getFullYear() + amount);
          break;
        case 'month':
          d.setMonth(d.getMonth() + amount);
          break;
        case 'week':
          d.setDate(d.getDate() + amount * 7);
          break;
        case 'day':
          d.setDate(d.getDate() + amount);
          break;
        case 'hour':
          d.setHours(d.getHours() + amount);
          break;
        case 'minute':
          d.setMinutes(d.getMinutes() + amount);
          break;
        case 'second':
          d.setSeconds(d.getSeconds() + amount);
          break;
        case 'millisecond':
          d.setMilliseconds(d.getMilliseconds() + amount);
          break;
        default:
          break;
      }
      return d.getTime();
    },
    diff(a: number, b: number, unit: string): number {
      return (a - b) / (UNIT_MS[unit] ?? 1);
    },
    startOf(timestamp: number, unit: string): number {
      return startOfTimestamp(timestamp, unit);
    },
    endOf(timestamp: number, unit: string): number {
      return startOfTimestamp(timestamp, unit) + (UNIT_MS[unit] ?? 1) - 1;
    },
  });
}

/**
 * Test-only typed view of the component internals.
 *
 * The chart field is deliberately `private` on the component — tests need to
 * verify reconciliation behaviour, so we cast through a narrow structural type
 * (same pattern as marketplace-chart.spec.ts).
 */
interface ComponentInternals {
  chart: Chart | null;
}
function internals(c: SensorChartComponent): ComponentInternals {
  return c as unknown as ComponentInternals;
}

/**
 * Drives the component's `ngOnChanges` lifecycle with a synthetic
 * `SimpleChanges` literal. The input binding is also assigned, since
 * `ngOnChanges` reads from `this.data`/`this.series`.
 */
function triggerInputs(component: SensorChartComponent, patch: Record<string, unknown>): void {
  const changes: SimpleChanges = {};
  for (const [key, value] of Object.entries(patch)) {
    (changes as Record<string, SimpleChange>)[key] = new SimpleChange(undefined, value, false);
    (component as unknown as Record<string, unknown>)[key] = value;
  }
  component.ngOnChanges(changes);
}

describe('SensorChartComponent', () => {
  let fixture: ComponentFixture<SensorChartComponent>;
  let component: SensorChartComponent;
  let getContextSpy: ReturnType<typeof vi.spyOn>;

  const mockGetContext = function (
    this: HTMLCanvasElement,
    contextId: string,
  ): CanvasRenderingContext2D | null {
    if (contextId !== '2d') return null;
    return createMock2DContext(this);
  } as unknown as typeof HTMLCanvasElement.prototype.getContext;

  beforeEach(async () => {
    installDateAdapter();

    getContextSpy = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockImplementation(mockGetContext);

    // jsdom does not schedule animation frames unless _pretendToBeVisual is
    // enabled; Chart.js uses requestAnimationFrame for its deferred draws.
    if (typeof window.requestAnimationFrame !== 'function') {
      window.requestAnimationFrame = (cb) =>
        setTimeout(() => cb(Date.now()), 16) as unknown as number;
    }

    // Chart.js uses ResizeObserver when responsive: true, which jsdom lacks.
    if (typeof (globalThis as { ResizeObserver?: unknown }).ResizeObserver !== 'function') {
      class ResizeObserverStub {
        observe(): void {}
        unobserve(): void {}
        disconnect(): void {}
      }
      (globalThis as { ResizeObserver?: unknown }).ResizeObserver = ResizeObserverStub;
    }

    await TestBed.configureTestingModule({
      imports: [SensorChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SensorChartComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    getContextSpy.mockRestore();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('new API (data + parameters)', () => {
    it('renders without throwing on empty data', () => {
      component.data = [];
      component.parameters = [PH_PARAM, TEMP_PARAM];
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('creates a single chart instance on ngAfterViewInit', () => {
      component.data = [mkReading('2025-01-01T00:00:00Z', { ph: 7.2 })];
      component.parameters = [PH_PARAM];
      fixture.detectChanges();
      expect(internals(component).chart).toBeInstanceOf(Chart);
    });

    it('destroys and recreates the chart when the data input changes', () => {
      component.data = [mkReading('2025-01-01T00:00:00Z', { ph: 7.2 })];
      component.parameters = [PH_PARAM];
      fixture.detectChanges();
      const first = internals(component).chart;
      expect(first).toBeInstanceOf(Chart);

      const destroySpy = vi.spyOn(Chart.prototype, 'destroy');
      try {
        triggerInputs(component, {
          data: [mkReading('2025-01-02T00:00:00Z', { ph: 7.4 })],
        });
        fixture.detectChanges();

        expect(destroySpy).toHaveBeenCalled();
        const second = internals(component).chart;
        expect(second).toBeInstanceOf(Chart);
        expect(second).not.toBe(first);
      } finally {
        destroySpy.mockRestore();
      }
    });

    it('does not register the y1 scale when dual-axis parameters have no readings', () => {
      // needsDualAxis() is true for pH + temperature, but the feed only
      // contains pH values — the secondary axis must not be created.
      component.data = [
        mkReading('2025-01-01T00:00:00Z', { ph: 7.2 }),
        mkReading('2025-01-01T01:00:00Z', { ph: 7.3 }),
      ];
      component.parameters = [PH_PARAM, TEMP_PARAM];
      fixture.detectChanges();

      const chart = internals(component).chart;
      expect(chart).toBeInstanceOf(Chart);
      expect((chart as unknown as { scales: Record<string, unknown> }).scales).not.toHaveProperty(
        'y1',
      );
    });

    it('registers the y1 scale when the secondary-axis parameters have readings', () => {
      component.data = [
        mkReading('2025-01-01T00:00:00Z', { ph: 7.2, temperature: 21 }),
        mkReading('2025-01-01T01:00:00Z', { ph: 7.3, temperature: 22 }),
      ];
      component.parameters = [PH_PARAM, TEMP_PARAM];
      fixture.detectChanges();

      const chart = internals(component).chart;
      expect(chart).toBeInstanceOf(Chart);
      expect((chart as unknown as { scales: Record<string, unknown> }).scales).toHaveProperty('y1');
    });
  });

  describe('legacy API (series)', () => {
    it('renders without throwing on empty series', () => {
      component.series = [];
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('builds one dataset per series', () => {
      const series: ChartSeries[] = [
        { label: 'pH', data: [{ x: 1000, y: 7.2 }], color: '#7B2FBE' },
        { label: 'Temp', data: [{ x: 1000, y: 21 }], color: '#0EA5E9' },
      ];
      component.series = series;
      fixture.detectChanges();

      const chart = internals(component).chart;
      expect(chart).toBeInstanceOf(Chart);
      expect(chart!.data.datasets).toHaveLength(2);
      expect(chart!.data.datasets[0].label).toBe('pH');
      expect(chart!.data.datasets[1].label).toBe('Temp');
    });

    it('uses beginAtZero: true on the legacy y axis (documented difference from the new API)', () => {
      component.series = [{ label: 'pH', data: [{ x: 1000, y: 7.2 }] }];
      fixture.detectChanges();

      const chart = internals(component).chart as unknown as {
        scales: Record<string, { options: { beginAtZero?: boolean } }>;
      };
      expect(chart.scales['y'].options.beginAtZero).toBe(true);
    });
  });
});
