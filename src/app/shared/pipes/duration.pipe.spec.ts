import { DurationPipe } from './duration.pipe';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('DurationPipe', () => {
  let pipe: DurationPipe;

  beforeEach(() => {
    pipe = new DurationPipe();
    // Set a fixed system time for deterministic tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should format future dates correctly', () => {
    // 3 days and 4 hours in the future
    const futureDate = new Date('2024-01-04T16:00:00Z');
    expect(pipe.transform(futureDate)).toBe('in 3d 4h');
  });

  it('should format past dates correctly', () => {
    // 2 days and 1 hour ago
    const pastDate = new Date('2023-12-30T11:00:00Z');
    expect(pipe.transform(pastDate)).toBe('2d 1h ago');
  });

  it('should format exactly now correctly', () => {
    const now = new Date('2024-01-01T12:00:00Z');
    expect(pipe.transform(now)).toBe('in <1m');
  });

  it('should format countdown mode correctly for future dates', () => {
    const futureDate = new Date('2024-01-04T16:00:00Z');
    expect(pipe.transform(futureDate, 'countdown')).toBe('3d 4h');
  });

  it('should handle invalid dates gracefully', () => {
    expect(pipe.transform('invalid-date')).toBe('');
    expect(pipe.transform('')).toBe('');
    // @ts-ignore testing invalid input
    expect(pipe.transform(null)).toBe('');
  });
});
