import { NumberAbbreviatePipe } from './number-abbreviate.pipe';

describe('NumberAbbreviatePipe', () => {
  let pipe: NumberAbbreviatePipe;

  beforeEach(() => {
    pipe = new NumberAbbreviatePipe();
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return "0" for 0', () => {
    expect(pipe.transform(0)).toBe('0');
  });

  it('should return "999.00" for 999 (no suffix)', () => {
    expect(pipe.transform(999)).toBe('999.00');
  });

  it('should return "1.00K" for 1000 (K boundary)', () => {
    expect(pipe.transform(1000)).toBe('1.00K');
  });

  it('should return "1.00M" for 1_000_000 (M boundary)', () => {
    expect(pipe.transform(1_000_000)).toBe('1.00M');
  });

  it('should return "1.00B" for 1_000_000_000 (B boundary)', () => {
    expect(pipe.transform(1_000_000_000)).toBe('1.00B');
  });

  it('should handle negative values', () => {
    expect(pipe.transform(-1000)).toBe('-1.00K');
    expect(pipe.transform(-1_500_000)).toBe('-1.50M');
  });

  it('should handle string input', () => {
    expect(pipe.transform('1234')).toBe('1.23K');
    expect(pipe.transform('123')).toBe('123.00');
  });

  it('should return "0" for NaN string input', () => {
    expect(pipe.transform('abc')).toBe('0');
  });

  it('should respect custom decimals', () => {
    expect(pipe.transform(12345, 1)).toBe('12.3K');
    expect(pipe.transform(1234567, 0)).toBe('1M');
  });
});
