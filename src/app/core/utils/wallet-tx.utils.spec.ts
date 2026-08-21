import { isUserDeclined, extractSigningError } from './wallet-tx.utils';

describe('isUserDeclined', () => {
  // ── Matching cases ─────────────────────────────────────────────────────────

  it('returns true for Error("User declined")', () => {
    expect(isUserDeclined(new Error('User declined'))).toBe(true);
  });

  it('returns true for the EIP-1193 phrasing Error("User rejected the request")', () => {
    expect(isUserDeclined(new Error('User rejected the request'))).toBe(true);
  });

  it('returns true for Error("cancelled")', () => {
    expect(isUserDeclined(new Error('cancelled'))).toBe(true);
  });

  it('returns true for American English "canceled"', () => {
    expect(isUserDeclined(new Error('Transaction canceled by the user'))).toBe(true);
  });

  it('returns true for a plain object { message: "rejected" }', () => {
    expect(isUserDeclined({ message: 'rejected' })).toBe(true);
  });

  it('returns true for a bare string "declined"', () => {
    expect(isUserDeclined('declined')).toBe(true);
  });

  it('returns true for a nested structured rejection under .error.message', () => {
    expect(isUserDeclined({ error: { message: 'User declined' } })).toBe(true);
  });

  it('returns true for a nested structured rejection under .data.message', () => {
    expect(isUserDeclined({ data: { message: 'Request rejected' } })).toBe(true);
  });

  it('returns true for a nested structured rejection where .error is a bare string', () => {
    expect(isUserDeclined({ error: 'User cancelled the request' })).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isUserDeclined(new Error('REJECTED by wallet'))).toBe(true);
  });

  // ── Non-matching cases ────────────────────────────────────────────────────

  it('returns false for a genuine Error("network timeout")', () => {
    expect(isUserDeclined(new Error('network timeout'))).toBe(false);
  });

  it('returns false for a generic extension error', () => {
    expect(isUserDeclined(new Error('Freighter extension not found'))).toBe(false);
  });

  it('returns false for null', () => {
    expect(isUserDeclined(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isUserDeclined(undefined)).toBe(false);
  });

  it('returns false for an object with no recognisable message shape', () => {
    expect(isUserDeclined({ code: 4001 })).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isUserDeclined('')).toBe(false);
  });
});

describe('extractSigningError', () => {
  it('extracts the message from an Error instance', () => {
    expect(extractSigningError(new Error('network timeout'))).toBe('network timeout');
  });

  it('extracts the message from a plain object with a message string', () => {
    expect(extractSigningError({ message: 'insufficient balance' })).toBe('insufficient balance');
  });

  it('extracts a bare string as-is', () => {
    expect(extractSigningError('signature invalid')).toBe('signature invalid');
  });

  it('extracts a nested message under .error.message', () => {
    expect(extractSigningError({ error: { message: 'nested failure' } })).toBe('nested failure');
  });

  it('extracts a nested message under .data.message', () => {
    expect(extractSigningError({ data: { message: 'nested data failure' } })).toBe(
      'nested data failure',
    );
  });

  it('falls back to the default message for null', () => {
    expect(extractSigningError(null)).toBe('Signing failed');
  });

  it('falls back to the default message for undefined', () => {
    expect(extractSigningError(undefined)).toBe('Signing failed');
  });

  it('falls back to a caller-supplied message', () => {
    expect(extractSigningError(null, 'Submission failed')).toBe('Submission failed');
  });

  it('falls back to the default message for an unrecognised object shape', () => {
    expect(extractSigningError({ code: 4001 })).toBe('Signing failed');
  });
});
