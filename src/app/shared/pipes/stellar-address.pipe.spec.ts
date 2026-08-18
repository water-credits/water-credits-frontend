import { StellarAddressPipe } from './stellar-address.pipe';

describe('StellarAddressPipe', () => {
  let pipe: StellarAddressPipe;

  beforeEach(() => {
    pipe = new StellarAddressPipe();
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string for falsy input', () => {
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform(undefined as unknown as string)).toBe('');
  });

  it('should truncate long address', () => {
    const address = 'GABCDEFHIJKLMNOPQRST';
    const truncated = pipe.transform(address);
    expect(truncated).toContain('...');
    expect(truncated).toHaveLength(4 + 3 + 4); // 4 chars + ... + 4 chars
  });

  it('should not truncate short address', () => {
    const address = 'GABC';
    expect(pipe.transform(address)).toBe(address);
  });

  it('should return address exactly at boundary', () => {
    const address = 'GABCDEFHJKL'; // length 11, boundary is chars*2+3 = 4*2+3=11
    expect(pipe.transform(address)).toBe(address);
  });

  it('should use custom chars parameter', () => {
    const address = 'ABCDEFGHIJK'; // length 11, boundary for chars=3 is 3*2+3=9
    const truncated = pipe.transform(address, 3);
    expect(truncated).toBe('ABC...IJK');
  });
});
