import { isWalletDeclined } from './wallet.utils';

describe('isWalletDeclined', () => {
  // ── Matching cases — all five sentinel substrings ─────────────────────────

  it('returns true for the exact Freighter v6 prefix "User declined"', () => {
    expect(isWalletDeclined(new Error('User declined the signing request'))).toBe(true);
  });

  it('returns true for lowercase "declined"', () => {
    expect(isWalletDeclined(new Error('Transaction declined by user'))).toBe(true);
  });

  it('returns true for "rejected"', () => {
    expect(isWalletDeclined(new Error('Request rejected'))).toBe(true);
  });

  it('returns true for British English "cancelled"', () => {
    expect(isWalletDeclined(new Error('Operation cancelled'))).toBe(true);
  });

  it('returns true for American English "canceled"', () => {
    expect(isWalletDeclined(new Error('Transaction canceled by the user'))).toBe(true);
  });

  // ── Non-matching cases ────────────────────────────────────────────────────

  it('returns false for a genuine network error message', () => {
    expect(isWalletDeclined(new Error('Network request failed'))).toBe(false);
  });

  it('returns false for a generic extension error', () => {
    expect(isWalletDeclined(new Error('Freighter extension not found'))).toBe(false);
  });

  it('returns false for a non-Error value (string)', () => {
    expect(isWalletDeclined('User declined')).toBe(false);
  });

  it('returns false for a non-Error value (object)', () => {
    expect(isWalletDeclined({ message: 'User declined' })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isWalletDeclined(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isWalletDeclined(undefined)).toBe(false);
  });

  // ── Case insensitivity ───────────────────────────────────────────────────

  it('returns true when sentinel is upper-cased inside message', () => {
    expect(isWalletDeclined(new Error('REJECTED by wallet'))).toBe(true);
  });

  it('returns true when "User declined" appears mid-message', () => {
    expect(isWalletDeclined(new Error('Stellar: User declined to sign'))).toBe(true);
  });
});
