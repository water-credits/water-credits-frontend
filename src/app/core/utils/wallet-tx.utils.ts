/**
 * Shared wallet transaction-signing error utilities.
 *
 * Centralises the "did the user just decline the signing prompt" check and
 * the fallback message extraction that were previously duplicated across
 * RetirementEffects, MarketplaceEffects, and GovernanceEffects.
 */

/** Shape of a structured rejection nested under `.error` or `.data`, as some wallet SDKs emit. */
interface NestedErrorShape {
  message?: unknown;
}

/** Shape of a plain-object error/rejection, e.g. `{ message: 'User declined' }`. */
interface StructuredErrorShape {
  message?: unknown;
  error?: unknown;
  data?: unknown;
}

function messageFromNested(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  if (value && typeof value === 'object') {
    const { message } = value as NestedErrorShape;
    if (typeof message === 'string') {
      return message;
    }
  }
  return undefined;
}

/**
 * Extracts a human-readable message from an unknown thrown/rejected value.
 *
 * Handles, in order: `Error` instances, bare strings, plain objects with a
 * `message` string, and structured rejections that nest the message under
 * `.error` or `.data` (a pattern used by some wallet SDKs). Returns
 * `undefined` when no message can be recovered (e.g. `null`, `undefined`,
 * or a shape with none of the above).
 */
function extractMessage(err: unknown): string | undefined {
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === 'string') {
    return err;
  }
  if (err && typeof err === 'object') {
    const { message, error, data } = err as StructuredErrorShape;
    if (typeof message === 'string') {
      return message;
    }
    return messageFromNested(error) ?? messageFromNested(data);
  }
  return undefined;
}

/**
 * Sentinel substrings matched against the extracted rejection message.
 *
 * Freighter v5 threw "User declined to sign the transaction."
 * Freighter v6 throws "User declined" or in some locales "User cancelled".
 * EIP-1193 wallets throw "User rejected the request." We also cover both
 * US ("canceled") and British ("cancelled") spellings, since wording has
 * varied across releases and SDKs.
 */
const DECLINE_SENTINELS = ['declined', 'rejected', 'cancelled', 'canceled'];

/**
 * Returns `true` when `err` represents the user explicitly dismissing a
 * wallet signing prompt rather than a genuine network or extension error.
 *
 * Callers should use this to route to a graceful "you cancelled" info toast
 * instead of an error toast on high-value financial actions.
 *
 * @param err - The value caught in a `catch` block; typed as `unknown`
 *              because `catch` binds `unknown` in strict TypeScript.
 */
export function isUserDeclined(err: unknown): boolean {
  const message = extractMessage(err);
  if (!message) {
    return false;
  }

  const lower = message.toLowerCase();
  return DECLINE_SENTINELS.some((sentinel) => lower.includes(sentinel));
}

/**
 * Extracts a display-ready error message from an unknown signing failure.
 *
 * Falls back to `fallback` when no message can be recovered from `err`
 * (e.g. `null`, `undefined`, or an unrecognised shape).
 */
export function extractSigningError(err: unknown, fallback = 'Signing failed'): string {
  return extractMessage(err) ?? fallback;
}
