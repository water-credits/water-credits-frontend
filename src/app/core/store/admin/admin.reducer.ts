import { createReducer, on } from '@ngrx/store';
import * as AdminActions from './admin.actions';
import { User } from '../../models/user.model';
import { OracleSubmission } from '../../models/oracle.model';
import { GovernanceConfig } from '../../models/proposal.model';

export interface AdminSystemEvent {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

export interface AdminHealth {
  totalUsers: number;
  activeOracles: number;
  totalOracles: number;
  pendingQueueDepth: number;
  apiLatencyMs: number;
}

export interface AdminState {
  // Health
  health: AdminHealth | null;
  recentEvents: AdminSystemEvent[];
  loadingHealth: boolean;
  loadingEvents: boolean;

  // Users
  users: User[];
  usersTotal: number;
  usersPage: number;
  usersTotalPages: number;
  loadingUsers: boolean;
  updatingUser: boolean;
  deletingUser: boolean;

  // Oracles
  oracles: OracleSubmission[];
  oraclesTotal: number;
  oraclesPage: number;
  oraclesTotalPages: number;
  loadingOracles: boolean;
  addingOracle: boolean;
  removingOracle: boolean;

  // Config / Fees
  config: GovernanceConfig | null;
  loadingConfig: boolean;
  savingConfig: boolean;

  // Shared error
  error: string | null;
}

const initialState: AdminState = {
  health: null,
  recentEvents: [],
  loadingHealth: false,
  loadingEvents: false,

  users: [],
  usersTotal: 0,
  usersPage: 1,
  usersTotalPages: 1,
  loadingUsers: false,
  updatingUser: false,
  deletingUser: false,

  oracles: [],
  oraclesTotal: 0,
  oraclesPage: 1,
  oraclesTotalPages: 1,
  loadingOracles: false,
  addingOracle: false,
  removingOracle: false,

  config: null,
  loadingConfig: false,
  savingConfig: false,

  error: null,
};

export const adminReducer = createReducer(
  initialState,

  // ── System Health ───────────────────────────────────────────────────────────
  on(AdminActions.loadAdminHealth, (state) => ({ ...state, loadingHealth: true, error: null })),
  on(AdminActions.loadAdminHealthSuccess, (state, { health }) => ({
    ...state,
    health,
    loadingHealth: false,
  })),
  on(AdminActions.loadAdminHealthFailure, (state, { error }) => ({
    ...state,
    loadingHealth: false,
    error,
  })),

  // ── System Events ───────────────────────────────────────────────────────────
  on(AdminActions.loadAdminEvents, (state) => ({ ...state, loadingEvents: true, error: null })),
  on(AdminActions.loadAdminEventsSuccess, (state, { events }) => ({
    ...state,
    recentEvents: events,
    loadingEvents: false,
  })),
  on(AdminActions.loadAdminEventsFailure, (state, { error }) => ({
    ...state,
    loadingEvents: false,
    error,
  })),

  // ── Users ───────────────────────────────────────────────────────────────────
  on(AdminActions.loadAdminUsers, (state) => ({ ...state, loadingUsers: true, error: null })),
  on(AdminActions.loadAdminUsersSuccess, (state, { users, total, page, totalPages }) => ({
    ...state,
    users,
    usersTotal: total,
    usersPage: page,
    usersTotalPages: totalPages,
    loadingUsers: false,
  })),
  on(AdminActions.loadAdminUsersFailure, (state, { error }) => ({
    ...state,
    loadingUsers: false,
    error,
  })),

  on(AdminActions.updateUserRole, (state) => ({ ...state, updatingUser: true, error: null })),
  on(AdminActions.updateUserRoleSuccess, (state, { user }) => ({
    ...state,
    users: state.users.map((u) => (u.id === user.id ? user : u)),
    updatingUser: false,
  })),
  on(AdminActions.updateUserRoleFailure, (state, { error }) => ({
    ...state,
    updatingUser: false,
    error,
  })),

  on(AdminActions.updateUserKyc, (state) => ({ ...state, updatingUser: true, error: null })),
  on(AdminActions.updateUserKycSuccess, (state, { user }) => ({
    ...state,
    users: state.users.map((u) => (u.id === user.id ? user : u)),
    updatingUser: false,
  })),
  on(AdminActions.updateUserKycFailure, (state, { error }) => ({
    ...state,
    updatingUser: false,
    error,
  })),

  on(AdminActions.deleteUser, (state) => ({ ...state, deletingUser: true, error: null })),
  on(AdminActions.deleteUserSuccess, (state, { userId }) => ({
    ...state,
    users: state.users.filter((u) => u.id !== userId),
    usersTotal: state.usersTotal - 1,
    deletingUser: false,
  })),
  on(AdminActions.deleteUserFailure, (state, { error }) => ({
    ...state,
    deletingUser: false,
    error,
  })),

  // ── Oracles ─────────────────────────────────────────────────────────────────
  on(AdminActions.loadAdminOracles, (state) => ({ ...state, loadingOracles: true, error: null })),
  on(AdminActions.loadAdminOraclesSuccess, (state, { oracles, total, page, totalPages }) => ({
    ...state,
    oracles,
    oraclesTotal: total,
    oraclesPage: page,
    oraclesTotalPages: totalPages,
    loadingOracles: false,
  })),
  on(AdminActions.loadAdminOraclesFailure, (state, { error }) => ({
    ...state,
    loadingOracles: false,
    error,
  })),

  on(AdminActions.addOracle, (state) => ({ ...state, addingOracle: true, error: null })),
  on(AdminActions.addOracleSuccess, (state) => ({ ...state, addingOracle: false })),
  on(AdminActions.addOracleFailure, (state, { error }) => ({
    ...state,
    addingOracle: false,
    error,
  })),

  on(AdminActions.removeOracle, (state) => ({ ...state, removingOracle: true, error: null })),
  on(AdminActions.removeOracleSuccess, (state) => ({ ...state, removingOracle: false })),
  on(AdminActions.removeOracleFailure, (state, { error }) => ({
    ...state,
    removingOracle: false,
    error,
  })),

  // ── Config / Fees ───────────────────────────────────────────────────────────
  on(AdminActions.loadAdminConfig, (state) => ({ ...state, loadingConfig: true, error: null })),
  on(AdminActions.loadAdminConfigSuccess, (state, { config }) => ({
    ...state,
    config,
    loadingConfig: false,
  })),
  on(AdminActions.loadAdminConfigFailure, (state, { error }) => ({
    ...state,
    loadingConfig: false,
    error,
  })),

  on(AdminActions.saveAdminConfig, (state) => ({ ...state, savingConfig: true, error: null })),
  on(AdminActions.saveAdminConfigSuccess, (state, { config }) => ({
    ...state,
    config,
    savingConfig: false,
  })),
  on(AdminActions.saveAdminConfigFailure, (state, { error }) => ({
    ...state,
    savingConfig: false,
    error,
  })),
);
