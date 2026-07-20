import { createAction, props } from '@ngrx/store';
import { User, UserRole } from '../../models/user.model';
import { OracleSubmission } from '../../models/oracle.model';
import { GovernanceConfig } from '../../models/proposal.model';

// ── System Health ─────────────────────────────────────────────────────────────

export const loadAdminHealth = createAction('[Admin] Load Health');

export const loadAdminHealthSuccess = createAction(
  '[Admin] Load Health Success',
  props<{
    health: {
      totalUsers: number;
      activeOracles: number;
      totalOracles: number;
      pendingQueueDepth: number;
      apiLatencyMs: number;
    };
  }>(),
);

export const loadAdminHealthFailure = createAction(
  '[Admin] Load Health Failure',
  props<{ error: string }>(),
);

// ── System Events ─────────────────────────────────────────────────────────────

export const loadAdminEvents = createAction('[Admin] Load Events');

export const loadAdminEventsSuccess = createAction(
  '[Admin] Load Events Success',
  props<{ events: Array<{ id: string; type: string; message: string; createdAt: string }> }>(),
);

export const loadAdminEventsFailure = createAction(
  '[Admin] Load Events Failure',
  props<{ error: string }>(),
);

// ── Users ─────────────────────────────────────────────────────────────────────

export const loadAdminUsers = createAction(
  '[Admin] Load Users',
  props<{ page: number; limit: number }>(),
);

export const loadAdminUsersSuccess = createAction(
  '[Admin] Load Users Success',
  props<{ users: User[]; total: number; page: number; totalPages: number }>(),
);

export const loadAdminUsersFailure = createAction(
  '[Admin] Load Users Failure',
  props<{ error: string }>(),
);

export const updateUserRole = createAction(
  '[Admin] Update User Role',
  props<{ userId: string; role: UserRole }>(),
);

export const updateUserRoleSuccess = createAction(
  '[Admin] Update User Role Success',
  props<{ user: User }>(),
);

export const updateUserRoleFailure = createAction(
  '[Admin] Update User Role Failure',
  props<{ error: string }>(),
);

export const updateUserKyc = createAction(
  '[Admin] Update User KYC',
  props<{ userId: string; isKycVerified: boolean }>(),
);

export const updateUserKycSuccess = createAction(
  '[Admin] Update User KYC Success',
  props<{ user: User }>(),
);

export const updateUserKycFailure = createAction(
  '[Admin] Update User KYC Failure',
  props<{ error: string }>(),
);

export const deleteUser = createAction('[Admin] Delete User', props<{ userId: string }>());

export const deleteUserSuccess = createAction(
  '[Admin] Delete User Success',
  props<{ userId: string }>(),
);

export const deleteUserFailure = createAction(
  '[Admin] Delete User Failure',
  props<{ error: string }>(),
);

// ── Oracles ───────────────────────────────────────────────────────────────────

export const loadAdminOracles = createAction(
  '[Admin] Load Oracles',
  props<{ page: number; limit: number }>(),
);

export const loadAdminOraclesSuccess = createAction(
  '[Admin] Load Oracles Success',
  props<{ oracles: OracleSubmission[]; total: number; page: number; totalPages: number }>(),
);

export const loadAdminOraclesFailure = createAction(
  '[Admin] Load Oracles Failure',
  props<{ error: string }>(),
);

export const addOracle = createAction('[Admin] Add Oracle', props<{ address: string }>());

export const addOracleSuccess = createAction(
  '[Admin] Add Oracle Success',
  props<{ address: string }>(),
);

export const addOracleFailure = createAction(
  '[Admin] Add Oracle Failure',
  props<{ error: string }>(),
);

export const removeOracle = createAction('[Admin] Remove Oracle', props<{ address: string }>());

export const removeOracleSuccess = createAction(
  '[Admin] Remove Oracle Success',
  props<{ address: string }>(),
);

export const removeOracleFailure = createAction(
  '[Admin] Remove Oracle Failure',
  props<{ error: string }>(),
);

// ── Config / Fees ─────────────────────────────────────────────────────────────

export const loadAdminConfig = createAction('[Admin] Load Config');

export const loadAdminConfigSuccess = createAction(
  '[Admin] Load Config Success',
  props<{ config: GovernanceConfig }>(),
);

export const loadAdminConfigFailure = createAction(
  '[Admin] Load Config Failure',
  props<{ error: string }>(),
);

export const saveAdminConfig = createAction(
  '[Admin] Save Config',
  props<{ changes: Partial<GovernanceConfig> }>(),
);

export const saveAdminConfigSuccess = createAction(
  '[Admin] Save Config Success',
  props<{ config: GovernanceConfig }>(),
);

export const saveAdminConfigFailure = createAction(
  '[Admin] Save Config Failure',
  props<{ error: string }>(),
);
