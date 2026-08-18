import { DateFormatPipe } from './date-format.pipe';

describe('DateFormatPipe', () => {
  let pipe: DateFormatPipe;

  beforeEach(() => {
    pipe = new DateFormatPipe();
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string for falsy input', () => {
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform(null as unknown as string)).toBe('');
  });

  it('should format in medium mode (default)', () => {
    const result = pipe.transform('2025-01-01T00:00:00Z');
    expect(result).toContain('Jan 1, 2025');
  });

  it('should format in short mode', () => {
    const result = pipe.transform('2025-01-01T00:00:00Z', 'short');
    expect(result).toContain('Jan 1, 2025');
  });

  it('should return original value for invalid date string', () => {
    expect(pipe.transform('invalid-date')).toBe('invalid-date');
  });

  describe('relative mode', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2025-06-15T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return "just now" for seconds ago', () => {
      expect(pipe.transform('2025-06-15T11:59:30Z', 'relative')).toBe('just now');
    });

    it('should return minutes ago', () => {
      expect(pipe.transform('2025-06-15T11:55:00Z', 'relative')).toBe('5m ago');
    });

    it('should return hours ago', () => {
      expect(pipe.transform('2025-06-15T10:00:00Z', 'relative')).toBe('2h ago');
    });

    it('should return days ago', () => {
      expect(pipe.transform('2025-06-10T12:00:00Z', 'relative')).toBe('5d ago');
    });

    it('should return months ago', () => {
      expect(pipe.transform('2025-01-15T12:00:00Z', 'relative')).toBe('5mo ago');
    });

    it('should return years ago', () => {
      expect(pipe.transform('2023-06-15T12:00:00Z', 'relative')).toBe('2y ago');
    });
  });
});
