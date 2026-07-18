import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor, NgSwitch, NgSwitchCase, NgSwitchDefault } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService } from '../../../core/services/users.service';
import { NotificationService } from '../../../core/services/notification.service';
import { StellarAddressPipe } from '../../../shared/pipes/stellar-address.pipe';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import {
  DataTableComponent,
  ColumnDef,
} from '../../../shared/components/data-table/data-table.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog';
import { User, UserRole } from '../../../core/models/user.model';
import { LucideAngularModule, Trash2, Shield, Users } from 'lucide-angular';
import { getErrorMessage } from '../../../core/utils/error.utils';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    NgSwitch,
    NgSwitchCase,
    NgSwitchDefault,
    FormsModule,
    StellarAddressPipe,
    DateFormatPipe,
    DataTableComponent,
    StatusBadgeComponent,
    ConfirmDialogComponent,
    LucideAngularModule,
  ],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage user roles, KYC status, and access
          </p>
        </div>
      </div>

      <app-data-table
        [columns]="userColumns"
        [data]="users"
        [loading]="loading"
        [pagination]="pagination"
        [totalPages]="pagination?.totalPages ?? 1"
        [total]="pagination?.total ?? 0"
        [limit]="pagination?.limit ?? 10"
        (page)="onPageChange($event)"
        emptyTitle="No users found"
        emptyMessage="Users will appear here once they register."
      >
        <ng-template #row let-user let-col="column">
          <ng-container [ngSwitch]="col.key">
            <span *ngSwitchCase="'wallet'">{{ user.wallet | stellarAddress }}</span>

            <span *ngSwitchCase="'role'">
              <select
                [ngModel]="user.role"
                (ngModelChange)="onRoleChange(user, $event)"
                class="text-xs px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-bg text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-stellar-blue/50"
              >
                <option *ngFor="let role of roles" [value]="role">{{ role }}</option>
              </select>
            </span>

            <span *ngSwitchCase="'isKycVerified'">
              <button
                (click)="toggleKyc(user)"
                [class]="
                  user.isKycVerified
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-600'
                "
                class="text-xs px-2.5 py-1 rounded-full border font-medium transition-colors"
              >
                {{ user.isKycVerified ? 'Verified' : 'Unverified' }}
              </button>
            </span>

            <span *ngSwitchCase="'isActive'">
              <app-status-badge
                [status]="user.isActive ? 'active' : 'closed'"
                [label]="user.isActive ? 'Active' : 'Inactive'"
              ></app-status-badge>
            </span>

            <span *ngSwitchCase="'createdAt'">{{ user.createdAt | dateFormat: 'short' }}</span>

            <span *ngSwitchCase="'actions'">
              <button
                (click)="confirmDelete(user)"
                class="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <lucide-angular [img]="Trash2" class="w-4 h-4"></lucide-angular>
              </button>
            </span>

            <span *ngSwitchDefault>{{ user[col.key] }}</span>
          </ng-container>
        </ng-template>
      </app-data-table>
    </div>

    <app-confirm-dialog
      *ngIf="showDeleteDialog"
      title="Delete User"
      [message]="
        'Are you sure you want to delete user ' +
        (userToDelete?.displayName ?? userToDelete?.wallet ?? '' | stellarAddress) +
        '? This action cannot be undone.'
      "
      confirmLabel="Delete"
      confirmVariant="danger"
      (confirm)="deleteUser()"
      (cancel)="showDeleteDialog = false"
    />
  `,
})
export class AdminUsersComponent implements OnInit {
  protected loading = true;
  protected users: User[] = [];
  protected showDeleteDialog = false;
  protected userToDelete: User | null = null;
  protected page = 1;
  protected totalPages = 1;
  protected total = 0;
  protected limit = 10;

  protected readonly roles: string[] = Object.values(UserRole);
  protected readonly Trash2 = Trash2;
  protected readonly Shield = Shield;
  protected readonly Users = Users;

  protected userColumns: ColumnDef[] = [
    { key: 'wallet', label: 'Wallet', width: '18%' },
    { key: 'displayName', label: 'Display Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'isKycVerified', label: 'KYC' },
    { key: 'isActive', label: 'Status' },
    { key: 'createdAt', label: 'Created' },
    { key: 'actions', label: '', width: '60px', align: 'right' },
  ];

  constructor(
    private usersService: UsersService,
    private notification: NotificationService,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadUsers();
  }

  async onRoleChange(user: User, role: string): Promise<void> {
    try {
      await this.usersService.updateUserRole(user.id, role);
      user.role = role as UserRole;
      this.notification.success(
        'Role Updated',
        `${user.displayName || user.wallet}'s role changed to ${role}.`,
      );
    } catch (error) {
      this.notification.error(
        'Update Failed',
        getErrorMessage(error, 'Could not update user role.'),
      );
    }
  }

  async toggleKyc(user: User): Promise<void> {
    const newValue = !user.isKycVerified;
    try {
      await this.usersService.updateUserKyc(user.id, newValue);
      user.isKycVerified = newValue;
      this.notification.success(
        'KYC Updated',
        `KYC status for ${user.displayName || user.wallet} set to ${newValue ? 'verified' : 'unverified'}.`,
      );
    } catch (error) {
      this.notification.error(
        'Update Failed',
        getErrorMessage(error, 'Could not update KYC status.'),
      );
    }
  }

  confirmDelete(user: User): void {
    this.userToDelete = user;
    this.showDeleteDialog = true;
  }

  async deleteUser(): Promise<void> {
    if (!this.userToDelete) return;
    try {
      await this.usersService.deleteUser(this.userToDelete.id);
      this.notification.success(
        'User Deleted',
        `${this.userToDelete.displayName || this.userToDelete.wallet} has been deleted.`,
      );
      this.showDeleteDialog = false;
      this.userToDelete = null;
      await this.loadUsers();
    } catch (error) {
      this.notification.error('Delete Failed', getErrorMessage(error, 'Could not delete user.'));
    }
  }

  async onPageChange(page: number): Promise<void> {
    this.page = page;
    await this.loadUsers();
  }

  private async loadUsers(): Promise<void> {
    try {
      this.loading = true;
      const res = await this.usersService.getUsers({ page: this.page, limit: this.limit });
      this.users = res.data;
      this.page = res.page;
      this.totalPages = res.totalPages;
      this.total = res.total;
    } catch (error) {
      this.notification.error('Load Failed', getErrorMessage(error, 'Could not load users.'));
    } finally {
      this.loading = false;
    }
  }
}
