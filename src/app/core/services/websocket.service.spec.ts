import { vi, describe, afterEach, it, expect } from 'vitest';
import { WebsocketService } from './websocket.service';
import { LoggingService } from './logging.service';

// ---------------------------------------------------------------------------
// Mock socket.io-client so no real network connection is attempted.
// The mock is hoisted before any imports by vitest's module mocking system.
// ---------------------------------------------------------------------------
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => createSocketStub()),
}));

import { io } from 'socket.io-client';

// ---------------------------------------------------------------------------
// Minimal Socket.IO socket stub — tracks listeners by reference so we can
// assert precise deregistration behaviour.
// ---------------------------------------------------------------------------
interface HandlerEntry {
  event: string;
  handler: (...args: unknown[]) => void;
}

function createSocketStub() {
  const listeners: HandlerEntry[] = [];

  const stub = {
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      listeners.push({ event, handler });
    }),
    off: vi.fn((event: string, handler?: (...args: unknown[]) => void) => {
      if (handler) {
        const idx = listeners.findIndex((e) => e.event === event && e.handler === handler);
        if (idx !== -1) listeners.splice(idx, 1);
      } else {
        // Remove ALL listeners for this event — this is the bug we guard against.
        let i = listeners.length - 1;
        while (i >= 0) {
          if (listeners[i].event === event) listeners.splice(i, 1);
          i--;
        }
      }
    }),
    emit: vi.fn(),
    disconnect: vi.fn(),
    /** Fire all listeners registered for an event. */
    trigger(event: string, data: unknown) {
      listeners.filter((e) => e.event === event).forEach((e) => e.handler(data));
    },
    /** How many listeners are currently registered for an event. */
    listenerCount(event: string) {
      return listeners.filter((e) => e.event === event).length;
    },
  };

  return stub;
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const loggingMock: LoggingService = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
} as unknown as LoggingService;

function makeService(): { service: WebsocketService; socket: ReturnType<typeof createSocketStub> } {
  const socket = createSocketStub();
  (io as ReturnType<typeof vi.fn>).mockReturnValue(socket);

  const service = new WebsocketService(loggingMock);
  // Open the socket so on<T>() does not immediately error.
  service.connect('test-token', 'user-1');

  // The socket stored internally is the one `io` just returned.
  return { service, socket };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WebsocketService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // ── on<T>() — handler reference isolation ─────────────────────────────────
  //
  // This is the primary correctness regression for the bug fixed in this PR:
  // the old implementation called socket.off(event) with no handler reference,
  // which removed ALL listeners for that event name.

  describe('on<T>() — handler reference isolation', () => {
    it('registers a distinct handler reference for each subscription', () => {
      const { service, socket } = makeService();

      const sub1 = service.on('sensor:reading').subscribe();
      const sub2 = service.on('sensor:reading').subscribe();

      // socket.on was called for 'connect', 'disconnect', 'connect_error'
      // during connect(), plus once per on<T>() call.
      const readingCalls = (socket.on.mock.calls as unknown[][]).filter(
        (c) => c[0] === 'sensor:reading',
      );
      expect(readingCalls).toHaveLength(2);

      const handler1 = readingCalls[0][1];
      const handler2 = readingCalls[1][1];
      expect(typeof handler1).toBe('function');
      expect(typeof handler2).toBe('function');
      expect(handler1).not.toBe(handler2);

      sub1.unsubscribe();
      sub2.unsubscribe();
    });

    it("unsubscribing one subscription does not remove the other subscription's handler", () => {
      const { service, socket } = makeService();

      const received1: unknown[] = [];
      const received2: unknown[] = [];

      const sub1 = service.on('sensor:reading').subscribe((d) => received1.push(d));
      const sub2 = service.on('sensor:reading').subscribe((d) => received2.push(d));

      // Both receive the first event.
      socket.trigger('sensor:reading', { ph: 7.0 });
      expect(received1).toHaveLength(1);
      expect(received2).toHaveLength(1);

      // Unsubscribe only sub1.
      sub1.unsubscribe();

      // Verify socket.off was called with a specific handler reference (not
      // just the event name), i.e. the second argument must be a function.
      const offCalls = socket.off.mock.calls as unknown[][];
      const teardownCall = offCalls[offCalls.length - 1];
      expect(teardownCall[0]).toBe('sensor:reading');
      expect(typeof teardownCall[1]).toBe('function');

      // sub2 must still receive subsequent events.
      socket.trigger('sensor:reading', { ph: 7.5 });
      expect(received1).toHaveLength(1); // no new data for sub1
      expect(received2).toHaveLength(2); // sub2 still alive

      sub2.unsubscribe();
    });

    it('delivers data to each subscriber independently', () => {
      const { service, socket } = makeService();

      const values1: unknown[] = [];
      const values2: unknown[] = [];

      const sub1 = service.on('sensor:reading').subscribe((d) => values1.push(d));
      const sub2 = service.on('sensor:reading').subscribe((d) => values2.push(d));

      socket.trigger('sensor:reading', { ph: 6.8 });
      socket.trigger('sensor:reading', { ph: 7.1 });

      expect(values1).toEqual([{ ph: 6.8 }, { ph: 7.1 }]);
      expect(values2).toEqual([{ ph: 6.8 }, { ph: 7.1 }]);

      sub1.unsubscribe();
      sub2.unsubscribe();
    });

    it('removes exactly one handler per unsubscription, leaving the other intact', () => {
      const { service, socket } = makeService();

      const sub1 = service.on('sensor:reading').subscribe();
      const sub2 = service.on('sensor:reading').subscribe();

      expect(socket.listenerCount('sensor:reading')).toBe(2);

      sub1.unsubscribe();
      expect(socket.listenerCount('sensor:reading')).toBe(1);

      sub2.unsubscribe();
      expect(socket.listenerCount('sensor:reading')).toBe(0);
    });

    it('errors the observable when the socket is not yet connected', () => {
      // Create a service without calling connect() so socket remains null.
      const service = new WebsocketService(loggingMock);

      const errors: unknown[] = [];
      service.on('sensor:reading').subscribe({ error: (e) => errors.push(e) });

      expect(errors).toHaveLength(1);
      expect((errors[0] as Error).message).toContain('not connected');
    });
  });

  // ── connect() ─────────────────────────────────────────────────────────────

  describe('connect()', () => {
    it('disconnects an existing socket before opening a new connection', () => {
      const { service, socket: firstSocket } = makeService();

      // Prepare a second stub for the reconnect.
      const secondSocket = createSocketStub();
      (io as ReturnType<typeof vi.fn>).mockReturnValueOnce(secondSocket);

      service.connect('new-token', 'user-2');

      expect(firstSocket.disconnect).toHaveBeenCalledTimes(1);
    });

    it('updates connected$ to true when the underlying socket fires "connect"', () => {
      const { service, socket } = makeService();

      let latest: boolean | undefined;
      service.connected$.subscribe((v) => (latest = v));

      socket.trigger('connect', undefined);

      expect(latest).toBe(true);
    });
  });

  // ── disconnect() ──────────────────────────────────────────────────────────

  describe('disconnect()', () => {
    it('calls socket.disconnect() and nullifies the internal reference', () => {
      const { service, socket } = makeService();

      service.disconnect();

      expect(socket.disconnect).toHaveBeenCalled();
      expect((service as any).socket).toBeNull();
    });

    it('updates connected$ to false after the socket fires "disconnect"', () => {
      const { service, socket } = makeService();

      // Simulate the socket's own disconnect event (fired by Socket.IO on
      // loss of connection before service.disconnect() is called).
      socket.trigger('disconnect', undefined);

      let latest: boolean | undefined;
      service.connected$.subscribe((v) => (latest = v));
      expect(latest).toBe(false);
    });
  });

  // ── sensorReadings$ / sensorAlerts$ getters ────────────────────────────────

  describe('sensorReadings$', () => {
    it('emits on sensor:reading events', () => {
      const { service, socket } = makeService();
      const readings: unknown[] = [];

      const sub = service.sensorReadings$.subscribe((r) => readings.push(r));
      socket.trigger('sensor:reading', { ph: 7.2 });

      expect(readings).toEqual([{ ph: 7.2 }]);
      sub.unsubscribe();
    });
  });

  describe('sensorAlerts$', () => {
    it('emits on sensor:alert events', () => {
      const { service, socket } = makeService();
      const alerts: unknown[] = [];

      const sub = service.sensorAlerts$.subscribe((a) => alerts.push(a));
      socket.trigger('sensor:alert', { parameter: 'ph', severity: 'critical' });

      expect(alerts).toEqual([{ parameter: 'ph', severity: 'critical' }]);
      sub.unsubscribe();
    });
  });
});
