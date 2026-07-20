import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AdminState } from './admin.reducer';

export const selectAdminState = createFeatureSelector<AdminState>('admin');

// ── Health ────────────────────────────────────────────────────────────────────

export const selectAdminHealth = createSelector(selectAdminState, (s) => s.health);
export const selectAdminLoadingHealth = createSelector(selectAdminState, (s) => s.loadingHealth);
export const selectAdminRecentEvents = createSelector(selectAdminState, (s) => s.recentEvents);
export const selectAdminLoadingEvents = createSelector(selectAdminState, (s) => s.loadingEvents);

// ── Users ─────────────────────────────────────────────────────────────────────

export const selectAdminUsers = createSelector(selectAdminState, (s) => s.users);
export const selectAdminUsersTotal = createSelector(selectAdminState, (s) => s.usersTotal);
export const selectAdminUsersPage = createSelector(selectAdminState, (s) => s.usersPage);
export const selectAdminUsersTotalPages = createSelector(
  selectAdminState,
  (s) => s.usersTotalPages,
);
export const selectAdminLoadingUsers = createSelector(selectAdminState, (s) => s.loadingUsers);
export const selectAdminUpdatingUser = createSelector(selectAdminState, (s) => s.updatingUser);
export const selectAdminDeletingUser = createSelector(selectAdminState, (s) => s.deletingUser);

// ── Oracles ───────────────────────────────────────────────────────────────────

export const selectAdminOracles = createSelector(selectAdminState, (s) => s.oracles);
export const selectAdminOraclesTotal = createSelector(selectAdminState, (s) => s.oraclesTotal);
export const selectAdminOraclesPage = createSelector(selectAdminState, (s) => s.oraclesPage);
export const selectAdminOraclesTotalPages = createSelector(
  selectAdminState,
  (s) => s.oraclesTotalPages,
);
export const selectAdminLoadingOracles = createSelector(selectAdminState, (s) => s.loadingOracles);
export const selectAdminAddingOracle = createSelector(selectAdminState, (s) => s.addingOracle);
export const selectAdminRemovingOracle = createSelector(selectAdminState, (s) => s.removingOracle);

// ── Config ────────────────────────────────────────────────────────────────────

export const selectAdminConfig = createSelector(selectAdminState, (s) => s.config);
export const selectAdminLoadingConfig = createSelector(selectAdminState, (s) => s.loadingConfig);
export const selectAdminSavingConfig = createSelector(selectAdminState, (s) => s.savingConfig);

// ── Error ─────────────────────────────────────────────────────────────────────

export const selectAdminError = createSelector(selectAdminState, (s) => s.error);
