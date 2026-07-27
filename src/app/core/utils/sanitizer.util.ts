const SENSITIVE_KEY_REGEX = /token|jwt|auth|secret|key|mnemonic|seed|password|bearer|private/i;
const STELLAR_SECRET_SEED_REGEX = /\bS[A-Z0-9]{55}\b/g;
const JWT_REGEX = /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g;

export class SanitizerUtil {
  /**
   * Recursively sanitizes object properties or strings to redact sensitive information.
   */
  static sanitize<T>(data: T): T {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data === 'string') {
      return SanitizerUtil.sanitizeString(data) as T;
    }

    if (Array.isArray(data)) {
      return data.map((item) => SanitizerUtil.sanitize(item)) as unknown as T;
    }

    if (typeof data === 'object' && !(data instanceof Error) && !(data instanceof RegExp) && !(data instanceof Date)) {
      const sanitizedObj: Record<string, unknown> = {};
      for (const key of Object.keys(data as Record<string, unknown>)) {
        const value = (data as Record<string, unknown>)[key];
        if (SENSITIVE_KEY_REGEX.test(key)) {
          sanitizedObj[key] = '[REDACTED]';
        } else {
          sanitizedObj[key] = SanitizerUtil.sanitize(value);
        }
      }
      return sanitizedObj as T;
    }

    return data;
  }

  /**
   * Redacts known token/seed formats from raw string text.
   */
  private static sanitizeString(str: string): string {
    return str
      .replace(STELLAR_SECRET_SEED_REGEX, '[REDACTED_STELLAR_SEED]')
      .replace(JWT_REGEX, '[REDACTED_JWT_TOKEN]');
  }
}
