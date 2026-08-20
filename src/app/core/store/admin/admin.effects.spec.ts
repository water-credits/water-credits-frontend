import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, throwError } from 'rxjs';
import { Action } from '@ngrx/store';
import { AdminEffects } from './admin.effects';
import * as AdminActions from './admin.actions';
import { UsersService } from '../../services/users.service';
import { OracleService } from '../../services/oracle.service';
import { AdminService } from '../../services/admin.service';

describe('AdminEffects', () => {
  let actions$: Observable<Action>;
  let effects: AdminEffects;
  let usersService: jest.Mocked<UsersService>;
  let oracleService: jest.Mocked<OracleService>;
  let adminService: jest.Mocked<AdminService>;

  beforeEach(() => {
    usersService = { getUsers: jest.fn(), updateUserRole: jest.fn() } as any;
    oracleService = { getOracleStatus: jest.fn() } as any;
    adminService = { getAdminStats: jest.fn() } as any;

    TestBed.configureTestingModule({
      providers: [
        AdminEffects,
        provideMockActions(() => actions$),
        { provide: UsersService, useValue: usersService },
        { provide: OracleService, useValue: oracleService },
        { provide: AdminService, useValue: adminService },
      ],
    });

    effects = TestBed.inject(AdminEffects);
  });

  describe('loadAdminStatsEffect', () => {
    it('should handle forkJoin success and map activeOracles correctly', (done) => {
      actions$ = of(AdminActions.loadAdminStats());
      
      usersService.getUsers.mockReturnValue(of({ total: 100, data: [], page: 1, totalPages: 1 }) as any);
      oracleService.getOracleStatus.mockReturnValue(Promise.resolve([
        { id: '1', status: 'active' },
        { id: '2', status: 'inactive' },
        { id: '3', status: 'active' },
      ]) as any);
      adminService.getAdminStats.mockReturnValue(Promise.resolve({ pendingQueue: 5, apiLatency: 120 }));

      effects.loadAdminStatsEffect.subscribe(action => {
        expect(action).toEqual(AdminActions.loadAdminStatsSuccess({
          totalUsers: 100,
          activeOracles: 2,
          pendingQueue: 5,
          apiLatency: 120,
        }));
        done();
      });
    });

    it('should handle partial failure gracefully (fallback to null)', (done) => {
      actions$ = of(AdminActions.loadAdminStats());
      
      usersService.getUsers.mockReturnValue(of({ total: 50, data: [], page: 1, totalPages: 1 }) as any);
      // Fail oracle and admin stats
      oracleService.getOracleStatus.mockReturnValue(Promise.reject('Oracle Error'));
      adminService.getAdminStats.mockReturnValue(Promise.reject('Admin Stats Error'));

      effects.loadAdminStatsEffect.subscribe(action => {
        expect(action).toEqual(AdminActions.loadAdminStatsSuccess({
          totalUsers: 50,
          activeOracles: 0,
          pendingQueue: null,
          apiLatency: null,
        }));
        done();
      });
    });

    it('should dispatch loadAdminStatsFailure if getUsers fails', (done) => {
      actions$ = of(AdminActions.loadAdminStats());
      
      usersService.getUsers.mockReturnValue(throwError(() => new Error('Users failed')));
      oracleService.getOracleStatus.mockReturnValue(Promise.resolve([]));
      adminService.getAdminStats.mockReturnValue(Promise.resolve({ pendingQueue: 0, apiLatency: 0 }));

      effects.loadAdminStatsEffect.subscribe(action => {
        expect(action).toEqual(AdminActions.loadAdminStatsFailure({
          error: 'Users failed'
        }));
        done();
      });
    });
  });
});
