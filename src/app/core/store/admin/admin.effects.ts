import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, from } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { UsersService } from '../../services/users.service';
import * as AdminActions from './admin.actions';

@Injectable()
export class AdminEffects {
  private actions = inject(Actions);
  private usersService = inject(UsersService);

  loadAdminStatsEffect = createEffect(() =>
    this.actions.pipe(
      ofType(AdminActions.loadAdminStats),
      mergeMap(() =>
        from(this.usersService.getUsers({ page: 1, limit: 1 })).pipe(
          map((res) =>
            AdminActions.loadAdminStatsSuccess({
              totalUsers: res.total,
              // TODO: loadAdminStats derives activeOracles, pendingQueue, and apiLatency as hardcoded zeros from a user-count endpoint. This is a known limitation.
              activeOracles: 0,
              pendingQueue: 0,
              apiLatency: 0,
            }),
          ),
          catchError((error) => of(AdminActions.loadAdminStatsFailure({ error: error.message }))),
        ),
      ),
    ),
  );

  loadUsersEffect = createEffect(() =>
    this.actions.pipe(
      ofType(AdminActions.loadUsers),
      mergeMap(({ page, limit }) =>
        from(this.usersService.getUsers({ page, limit })).pipe(
          map((res) =>
            AdminActions.loadUsersSuccess({
              users: res.data,
              page: res.page,
              totalPages: res.totalPages,
              total: res.total,
            }),
          ),
          catchError((error) => of(AdminActions.loadUsersFailure({ error: error.message }))),
        ),
      ),
    ),
  );

  updateUserRoleEffect = createEffect(() =>
    this.actions.pipe(
      ofType(AdminActions.updateUserRole),
      mergeMap(({ userId, role }) =>
        from(this.usersService.updateUserRole(userId, role)).pipe(
          map(() => AdminActions.updateUserRoleSuccess()),
          catchError((error) => of(AdminActions.updateUserRoleFailure({ error: error.message }))),
        ),
      ),
    ),
  );

  // TODO: implement actual effect for toggleUserKyc
  toggleUserKycEffect = createEffect(() =>
    this.actions.pipe(
      ofType(AdminActions.toggleUserKyc),
      map(() => AdminActions.toggleUserKycSuccess())
    )
  );

  // TODO: implement actual effect for updateConfig
  updateConfigEffect = createEffect(() =>
    this.actions.pipe(
      ofType(AdminActions.updateConfig),
      map(() => AdminActions.updateConfigSuccess())
    )
  );
}
