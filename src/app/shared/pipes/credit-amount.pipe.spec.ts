import { describe, it, expect } from 'vitest';
import { CreditAmountPipe } from './credit-amount.pipe';

describe('CreditAmountPipe', () => {
  const pipe = new CreditAmountPipe();

  it('should format an integer with thousands separators', () => {
    expect(pipe.transform(1234)).toBe('1,234');
  });

  it('should format a string input', () => {
    expect(pipe.transform('1234.5')).toBe('1,234.5');
  });

  it('should return 0 for zero', () => {
    expect(pipe.transform(0)).toBe('0');
    expect(pipe.transform('0')).toBe('0');
  });

  it('should return 0 for NaN', () => {
    expect(pipe.transform(NaN)).toBe('0');
    expect(pipe.transform('abc')).toBe('0');
  });

  it('should format negative values with the default maxDecimals', () => {
    expect(pipe.transform(-5)).toBe('-5.0000000');
  });

  it('should format negative values using the maxDecimals parameter', () => {
    expect(pipe.transform(-5, 2)).toBe('-5.00');
  });

  it('should format values crossing the 1 threshold', () => {
    expect(pipe.transform(1)).toBe('1');
    expect(pipe.transform(1234.567)).toBe('1,234.57');
  });

  it('should format values crossing the 0.001 threshold', () => {
    expect(pipe.transform(0.9999)).toBe('0.9999');
    expect(pipe.transform(0.001)).toBe('0.0010');
    expect(pipe.transform(0.0009)).toBe('0.0009000');
  });

  it('should respect the maxDecimals parameter for very small values', () => {
    expect(pipe.transform(0.0001, 2)).toBe('0.00');
    expect(pipe.transform(0.0001)).toBe('0.0001000');
  });
});
