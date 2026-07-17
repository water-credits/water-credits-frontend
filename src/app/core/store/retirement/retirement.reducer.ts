import { createReducer, on } from '@ngrx/store';
import * as RetirementActions from './retirement.actions';
import { Retirement, RetirementCertificate } from '../../models/retirement.model';

/** The retirement wizard's current phase, used to drive UI state. */
export type RetirementPhase =
  | 'idle'
  | 'preparing'
  | 'awaiting_signature'
  | 'submitting'
  | 'confirmed'
  | 'failed';

export interface RetirementState {
  /** Paginated list from the Retirement History view. */
  retirements: Retirement[];
  total: number;
  page: number;
  totalPages: number;

  /** The retirement currently being processed through the wizard. */
  activeRetirement: Retirement | null;

  /** Certificate loaded for the certificate page. */
  certificate: RetirementCertificate | null;

  /** Wizard phase — drives spinner / step display. */
  phase: RetirementPhase;

  /** True while any async operation is in flight. */
  loading: boolean;

  error: string | null;
}

const initialState: RetirementState = {
  retirements: [],
  total: 0,
  page: 1,
  totalPages: 1,
  activeRetirement: null,
  certificate: null,
  phase: 'idle',
  loading: false,
  error: null,
};

export const retirementReducer = createReducer(
  initialState,

  // ── Initiation ──────────────────────────────────────────────────────────────
  on(RetirementActions.initiateRetirement, (state) => ({
    ...state,
    phase: 'preparing' as RetirementPhase,
    loading: true,
    error: null,
    activeRetirement: null,
    certificate: null,
  })),

  // ── Phase 1: Prepare ────────────────────────────────────────────────────────
  on(RetirementActions.retirementPrepared, (state, { prepareResponse }) => ({
    ...state,
    activeRetirement: prepareResponse.retirement,
    // If there is an XDR to sign we move to awaiting_signature; otherwise the
    // legacy path goes straight to submitting (no client-side signing needed).
    phase: (prepareResponse.unsignedXdr ? 'awaiting_signature' : 'submitting') as RetirementPhase,
  })),

  on(RetirementActions.retirementPrepareFailure, (state, { error }) => ({
    ...state,
    phase: 'failed' as RetirementPhase,
    loading: false,
    error,
  })),

  // ── Phase 2: Signing ────────────────────────────────────────────────────────
  on(RetirementActions.retirementSigned, (state) => ({
    ...state,
    phase: 'submitting' as RetirementPhase,
  })),

  on(RetirementActions.retirementSignatureRejected, (state) => ({
    // User cancelled — return to idle so the form can go back to the review step.
    ...state,
    phase: 'idle' as RetirementPhase,
    loading: false,
    error: null,
  })),

  on(RetirementActions.retirementSignatureFailure, (state, { error }) => ({
    ...state,
    phase: 'failed' as RetirementPhase,
    loading: false,
    error,
  })),

  // ── Phase 3: Submit ─────────────────────────────────────────────────────────
  on(RetirementActions.retirementSubmitted, (state, { retirement }) => ({
    ...state,
    activeRetirement: retirement,
    phase: 'confirmed' as RetirementPhase,
  })),

  on(RetirementActions.retirementSubmitFailure, (state, { error }) => ({
    ...state,
    phase: 'failed' as RetirementPhase,
    loading: false,
    error,
  })),

  // ── Phase 4: Confirmed ──────────────────────────────────────────────────────
  on(RetirementActions.retirementConfirmed, (state, { retirement }) => ({
    ...state,
    activeRetirement: retirement,
    phase: 'confirmed' as RetirementPhase,
    loading: false,
    error: null,
  })),

  // ── Generic failure ─────────────────────────────────────────────────────────
  on(RetirementActions.retirementFailure, (state, { error }) => ({
    ...state,
    phase: 'failed' as RetirementPhase,
    loading: false,
    error,
  })),

  // ── Load retirement list ─────────────────────────────────────────────────────
  on(RetirementActions.loadRetirements, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(
    RetirementActions.loadRetirementsSuccess,
    (state, { retirements, total, page, totalPages }) => ({
      ...state,
      retirements,
      total,
      page,
      totalPages,
      loading: false,
    }),
  ),

  on(RetirementActions.loadRetirementsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // ── Certificate ─────────────────────────────────────────────────────────────
  on(RetirementActions.loadRetirementCertificate, (state) => ({
    ...state,
    certificate: null,
    loading: true,
    error: null,
  })),

  on(RetirementActions.loadRetirementCertificateSuccess, (state, { certificate }) => ({
    ...state,
    certificate,
    loading: false,
  })),

  on(RetirementActions.loadRetirementCertificateFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),
);
