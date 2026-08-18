/**
 * Shared wallet utility functions.
 *
 * Centralises helpers that were previously duplicated across RetirementEffects,
 * MarketplaceEffects, and GovernanceEffects.
 */

/**
 * Sentinel substrings matched against Freighter's rejection error message.
 *
 * Freighter v5 threw "User declined to sign the transaction."
 * Freighter v6 throws "User declined" or in some locales "User cancelled".
 * We also cover third-party vocabulary ("rejected") so that future SDK
 * wording changes only need updating here — not in every effects file.
 *
 * Both US ("canceled") and British ("cancelled") spellings are checked because
 * Freighter's internal message vocabulary has varied between releases.
 */

/**
 * Returns `true` when `err` represents the user explicitly dismissing the
 * Freighter signing prompt rather than a genuine network or extension error.
 *
 * Callers should use this to route to a graceful "you cancelled" info toast
 * instead of an error toast on high-value financial actions.
 *
 * @param err - The value caught in a `catch` block; typed as `unknown`
 *              because `catch` binds `unknown` in strict TypeScript.
 */
export function isWalletDeclined(err: unknown): boolean {
  if (!(err instanceof Error)) {
    return false;
  }

  // First try the case-sensitive "User declined" prefix so we do not
  // accidentally match an error message like "This action was not declined".
  if (err.message.includes('User declined')) {
    return true;
  }

  // For the remaining sentinels use lowercase comparison so we are resilient
  // to capitalisation differences across Freighter releases.
  const lower = err.message.toLowerCase();
  return (
    lower.includes('declined') ||
    lower.includes('rejected') ||
    lower.includes('cancelled') ||
    lower.includes('canceled')
  );
}
