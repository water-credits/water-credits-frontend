import { SanitizerUtil } from './sanitizer.util';

describe('SanitizerUtil', () => {
  it('should redact sensitive key names from objects', () => {
    const raw = {
      username: 'john_doe',
      jwtToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.secret',
      secretKey: 'supersecret',
      password: 'password123',
    };

    const sanitized = SanitizerUtil.sanitize(raw);
    expect(sanitized.username).toBe('john_doe');
    expect(sanitized.jwtToken).toBe('[REDACTED]');
    expect(sanitized.secretKey).toBe('[REDACTED]');
    expect(sanitized.password).toBe('[REDACTED]');
  });

  it('should redact Stellar secret seed strings', () => {
    const rawString = 'My secret seed is SAAAAA12345678901234567890123456789012345678901234567890!';
    const sanitized = SanitizerUtil.sanitize(rawString);
    expect(sanitized).toBe('My secret seed is [REDACTED_STELLAR_SEED]!');
  });
});
