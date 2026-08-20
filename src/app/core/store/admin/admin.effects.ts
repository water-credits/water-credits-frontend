import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of, from, forkJoin } from 'rxjs';
import { catchError, map, mergeMap, switchMap } from 'rxjs/operators';
import { UsersService } from '../../services/users.service';
import { OracleService } from '../../services/oracle.service';
import { AdminService } from '../../services/admin.service';
import * as AdminActions from './admin.actions';

@Injectable()
export class AdminEffects {
  loadAdminStatsEffect = createEffect(() =>
    this.actions.pipe(
      ofType(AdminActions.loadAdminStats),
      switchMap(() =>
        forkJoin([
          from(this.usersService.getUsers({ page: 1, limit: 1 })),
          from(this.oracleService.getOracleStatus()).pipe(
            catchError(() => of([]))
          ),
          from(this.adminService.getAdminStats()).pipe(
            catchError(() => of({ pendingQueue: null, apiLatency: null })) // TODO: Implement dedicated backend endpoint (GET /admin/stats) or handle fallback gracefully
          )
        ]).pipe(
          map(([usersRes, oracleStatus, adminStats]) => {
            const activeOracles = oracleStatus.filter(node => node.status === 'active').length;
            return AdminActions.loadAdminStatsSuccess({
              totalUsers: usersRes.total,
              activeOracles,
              pendingQueue: adminStats?.pendingQueue ?? null,
              apiLatency: adminStats?.apiLatency ?? null,
            });
          }),
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

  constructor(
    private actions: Actions,
    private usersService: UsersService,
    private oracleService: OracleService,
    private adminService: AdminService
  ) {}
}
