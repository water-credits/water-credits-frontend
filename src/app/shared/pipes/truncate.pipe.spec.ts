import { TruncatePipe } from './truncate.pipe';

describe('TruncatePipe', () => {
  let pipe: TruncatePipe;

  beforeEach(() => {
    pipe = new TruncatePipe();
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string for falsy input', () => {
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform(undefined as unknown as string)).toBe('');
  });

  it('should return full string if under limit', () => {
    expect(pipe.transform('Short text')).toBe('Short text');
  });

  it('should truncate long string', () => {
    const longString = 'a'.repeat(100);
    expect(pipe.transform(longString, 50).length).toBe(53); // 50 chars + '...'
  });

  it('should return exact limit if string length matches', () => {
    const exactString = 'a'.repeat(50);
    expect(pipe.transform(exactString, 50)).toBe(exactString);
  });

  it('should use custom suffix', () => {
    const longString = 'a'.repeat(100);
    expect(pipe.transform(longString, 50, '…')).toContain('…');
  });
});
