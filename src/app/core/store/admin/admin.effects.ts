import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, from } from 'rxjs';
import { exhaustMap, switchMap, map, catchError, tap } from 'rxjs/operators';

import * as AdminActions from './admin.actions';
import { AdminService } from '../../services/admin.service';
import { WalletService } from '../../services/wallet.service';
import { NotificationService } from '../../services/notification.service';

function isUserDeclined(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return (
      msg.includes('declined') ||
      msg.includes('rejected') ||
      msg.includes('cancelled') ||
      msg.includes('canceled')
    );
  }
  return false;
}

@Injectable()
export class AdminEffects {
  private readonly actions$ = inject(Actions);
  private readonly adminService = inject(AdminService);
  private readonly walletService = inject(WalletService);
  private readonly notificationService = inject(NotificationService);

  // ── System Health ────────────────────────────────────────────────────────────

  loadHealth$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminActions.loadAdminHealth),
      switchMap(() =>
        from(this.adminService.getHealth()).pipe(
          map((health) => AdminActions.loadAdminHealthSuccess({ health })),
          catchError((err) =>
            of(
              AdminActions.loadAdminHealthFailure({
                error: err instanceof Error ? err.message : 'Failed to load system health',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  // ── System Events ────────────────────────────────────────────────────────────

  loadEvents$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminActions.loadAdminEvents),
      switchMap(() =>
        from(this.adminService.getRecentEvents(5)).pipe(
          map((events) => AdminActions.loadAdminEventsSuccess({ events })),
          catchError((err) =>
            of(
              AdminActions.loadAdminEventsFailure({
                error: err instanceof Error ? err.message : 'Failed to load events',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  // ── Users ────────────────────────────────────────────────────────────────────

  loadUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminActions.loadAdminUsers),
      switchMap(({ page, limit }) =>
        from(this.adminService.getUsers({ page, limit })).pipe(
          map(({ data, total, page: p, totalPages }) =>
            AdminActions.loadAdminUsersSuccess({ users: data, total, page: p, totalPages }),
          ),
          catchError((err) =>
            of(
              AdminActions.loadAdminUsersFailure({
                error: err instanceof Error ? err.message : 'Failed to load users',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  updateUserRole$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminActions.updateUserRole),
      exhaustMap(({ userId, role }) =>
        from(this.adminService.updateUserRole(userId, role)).pipe(
          map((user) => AdminActions.updateUserRoleSuccess({ user })),
          catchError((err) =>
            of(
              AdminActions.updateUserRoleFailure({
                error: err instanceof Error ? err.message : 'Failed to update role',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  updateUserRoleSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AdminActions.updateUserRoleSuccess),
        tap(({ user }) => {
          this.notificationService.success(
            'Role Updated',
            `${user.displayName || user.wallet} role changed to ${user.role}.`,
          );
        }),
      ),
    { dispatch: false },
  );

  updateUserRoleFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AdminActions.updateUserRoleFailure),
        tap(({ error }) => this.notificationService.error('Update Failed', error)),
      ),
    { dispatch: false },
  );

  updateUserKyc$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminActions.updateUserKyc),
      exhaustMap(({ userId, isKycVerified }) =>
        from(this.adminService.updateUserKyc(userId, isKycVerified)).pipe(
          map((user) => AdminActions.updateUserKycSuccess({ user })),
          catchError((err) =>
            of(
              AdminActions.updateUserKycFailure({
                error: err instanceof Error ? err.message : 'Failed to update KYC',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  updateUserKycSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AdminActions.updateUserKycSuccess),
        tap(({ user }) => {
          this.notificationService.success(
            'KYC Updated',
            `KYC status for ${user.displayName || user.wallet} updated.`,
          );
        }),
      ),
    { dispatch: false },
  );

  deleteUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminActions.deleteUser),
      exhaustMap(({ userId }) =>
        from(this.adminService.deleteUser(userId)).pipe(
          map(() => AdminActions.deleteUserSuccess({ userId })),
          catchError((err) =>
            of(
              AdminActions.deleteUserFailure({
                error: err instanceof Error ? err.message : 'Failed to delete user',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  deleteUserSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AdminActions.deleteUserSuccess),
        tap(() => this.notificationService.success('User Deleted', 'The user has been removed.')),
      ),
    { dispatch: false },
  );

  // ── Oracles ──────────────────────────────────────────────────────────────────

  loadOracles$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminActions.loadAdminOracles),
      switchMap(({ page, limit }) =>
        from(this.adminService.getOracles({ page, limit })).pipe(
          map(({ data, total, page: p, totalPages }) =>
            AdminActions.loadAdminOraclesSuccess({ oracles: data, total, page: p, totalPages }),
          ),
          catchError((err) =>
            of(
              AdminActions.loadAdminOraclesFailure({
                error: err instanceof Error ? err.message : 'Failed to load oracles',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  /**
   * Two-phase oracle registration:
   * 1. POST /admin/oracles → backend returns unsigned XDR (or resolves immediately)
   * 2. If XDR present → sign via Freighter → POST /admin/oracles/submit-add
   */
  addOracle$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminActions.addOracle),
      exhaustMap(({ address }) =>
        from(this.adminService.addOracle(address)).pipe(
          switchMap(async (response) => {
            const { unsignedXdr, networkPassphrase } = response;

            if (!unsignedXdr) {
              // Backend handled registration directly (off-chain path)
              return AdminActions.addOracleSuccess({ address });
            }

            // Freighter signing step
            let signedXdr: string | null;
            try {
              signedXdr = await this.walletService.signTx(
                unsignedXdr,
                'STELLAR',
                networkPassphrase,
              );
            } catch (sigErr) {
              if (isUserDeclined(sigErr)) {
                this.notificationService.info(
                  'Signing Cancelled',
                  'Oracle registration was not submitted.',
                );
                return AdminActions.addOracleFailure({ error: 'Signing cancelled by user' });
              }
              const msg = sigErr instanceof Error ? sigErr.message : 'Signing failed';
              return AdminActions.addOracleFailure({ error: msg });
            }

            if (!signedXdr) {
              return AdminActions.addOracleFailure({ error: 'No signed XDR returned' });
            }

            await this.adminService.submitOracleAdd(address, signedXdr);
            return AdminActions.addOracleSuccess({ address });
          }),
          catchError((err) =>
            of(
              AdminActions.addOracleFailure({
                error: err instanceof Error ? err.message : 'Failed to add oracle',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  addOracleSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AdminActions.addOracleSuccess),
        tap(({ address }) =>
          this.notificationService.success(
            'Oracle Registered',
            `${address.substring(0, 8)}... has been added.`,
          ),
        ),
      ),
    { dispatch: false },
  );

  addOracleFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AdminActions.addOracleFailure),
        tap(({ error }) => this.notificationService.error('Oracle Registration Failed', error)),
      ),
    { dispatch: false },
  );

  removeOracle$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminActions.removeOracle),
      exhaustMap(({ address }) =>
        from(this.adminService.removeOracle(address)).pipe(
          map(() => AdminActions.removeOracleSuccess({ address })),
          catchError((err) =>
            of(
              AdminActions.removeOracleFailure({
                error: err instanceof Error ? err.message : 'Failed to remove oracle',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  removeOracleSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AdminActions.removeOracleSuccess),
        tap(({ address }) =>
          this.notificationService.success(
            'Oracle Removed',
            `${address.substring(0, 8)}... has been removed.`,
          ),
        ),
      ),
    { dispatch: false },
  );

  removeOracleFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AdminActions.removeOracleFailure),
        tap(({ error }) => this.notificationService.error('Oracle Removal Failed', error)),
      ),
    { dispatch: false },
  );

  // ── Config / Fees ─────────────────────────────────────────────────────────────

  loadConfig$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminActions.loadAdminConfig),
      switchMap(() =>
        from(this.adminService.getConfig()).pipe(
          map((config) => AdminActions.loadAdminConfigSuccess({ config })),
          catchError((err) =>
            of(
              AdminActions.loadAdminConfigFailure({
                error: err instanceof Error ? err.message : 'Failed to load config',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  saveConfig$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminActions.saveAdminConfig),
      exhaustMap(({ changes }) =>
        from(this.adminService.updateConfig(changes)).pipe(
          map((config) => AdminActions.saveAdminConfigSuccess({ config })),
          catchError((err) =>
            of(
              AdminActions.saveAdminConfigFailure({
                error: err instanceof Error ? err.message : 'Failed to save config',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  saveConfigSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AdminActions.saveAdminConfigSuccess),
        tap(() =>
          this.notificationService.success(
            'Configuration Saved',
            'Protocol parameters updated successfully.',
          ),
        ),
      ),
    { dispatch: false },
  );

  saveConfigFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AdminActions.saveAdminConfigFailure),
        tap(({ error }) => this.notificationService.error('Save Failed', error)),
      ),
    { dispatch: false },
  );
}
