import { createAction, props } from '@ngrx/store';
import {
  Retirement,
  RetirementCertificate,
  RetirementPrepareResponse,
  RetirementRequest,
} from '../../models/retirement.model';

// ─── Initiation ──────────────────────────────────────────────────────────────

/** Dispatched by RetirementFormComponent when the user clicks "Confirm & Retire". */
export const initiateRetirement = createAction(
  '[Retirement] Initiate',
  props<{ request: RetirementRequest }>(),
);

// ─── Phase 1: Prepare (backend creates pending record + optional unsigned XDR) ─

export const retirementPrepared = createAction(
  '[Retirement] Prepared',
  props<{ prepareResponse: RetirementPrepareResponse }>(),
);

export const retirementPrepareFailure = createAction(
  '[Retirement] Prepare Failure',
  props<{ error: string }>(),
);

// ─── Phase 2: Freighter signing ───────────────────────────────────────────────

/** Emitted when Freighter resolves with a signed XDR. */
export const retirementSigned = createAction(
  '[Retirement] Signed',
  props<{ retirementId: string; signedXdr: string }>(),
);

/**
 * Emitted when the user explicitly rejects the Freighter signing prompt
 * (UserDeclinedException). This is NOT an error; the form returns to review.
 */
export const retirementSignatureRejected = createAction(
  '[Retirement] Signature Rejected',
  props<{ retirementId: string }>(),
);

export const retirementSignatureFailure = createAction(
  '[Retirement] Signature Failure',
  props<{ retirementId: string; error: string }>(),
);

// ─── Phase 3: Submit signed XDR ──────────────────────────────────────────────

export const retirementSubmitted = createAction(
  '[Retirement] Submitted',
  props<{ retirement: Retirement }>(),
);

export const retirementSubmitFailure = createAction(
  '[Retirement] Submit Failure',
  props<{ retirementId: string; error: string }>(),
);

// ─── Phase 4: On-chain confirmation ──────────────────────────────────────────

/**
 * Terminal success action. Emitted when the backend confirms on-chain
 * inclusion (or immediately for the legacy single-POST path).
 */
export const retirementConfirmed = createAction(
  '[Retirement] Confirmed',
  props<{ retirement: Retirement }>(),
);

/** Generic terminal failure (covers prepare / sign / submit). */
export const retirementFailure = createAction('[Retirement] Failure', props<{ error: string }>());

// ─── Read operations ─────────────────────────────────────────────────────────

export const loadRetirements = createAction(
  '[Retirement] Load List',
  props<{ page?: number; limit?: number }>(),
);

export const loadRetirementsSuccess = createAction(
  '[Retirement] Load List Success',
  props<{ retirements: Retirement[]; total: number; page: number; totalPages: number }>(),
);

export const loadRetirementsFailure = createAction(
  '[Retirement] Load List Failure',
  props<{ error: string }>(),
);

export const loadRetirementCertificate = createAction(
  '[Retirement] Load Certificate',
  props<{ id: string }>(),
);

export const loadRetirementCertificateSuccess = createAction(
  '[Retirement] Load Certificate Success',
  props<{ certificate: RetirementCertificate }>(),
);

export const loadRetirementCertificateFailure = createAction(
  '[Retirement] Load Certificate Failure',
  props<{ error: string }>(),
);
