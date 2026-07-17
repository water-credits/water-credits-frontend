import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor, NgClass, NgSwitch, NgSwitchCase } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, Plus, BarChart3 } from 'lucide-angular';
import { MarketplaceService, MarketplaceListing } from '../../../core/services/marketplace.service';
import { ProjectsService } from '../../../core/services/projects.service';
import {
  DataTableComponent,
  ColumnDef,
} from '../../../shared/components/data-table/data-table.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';
import { SearchInputComponent } from '../../../shared/components/search-input/search-input';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { CreditAmountPipe } from '../../../shared/pipes/credit-amount.pipe';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import { StellarAddressPipe } from '../../../shared/pipes/stellar-address.pipe';
import { NumberAbbreviatePipe } from '../../../shared/pipes/number-abbreviate.pipe';

@Component({
  selector: 'app-marketplace-listings',
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    NgClass,
    NgSwitch,
    NgSwitchCase,
    FormsModule,
    RouterLink,
    LucideAngularModule,
    DataTableComponent,
    StatusBadgeComponent,
    SearchInputComponent,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    CreditAmountPipe,
    DateFormatPipe,
    StellarAddressPipe,
    NumberAbbreviatePipe,
  ],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Marketplace</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse and trade water credits
          </p>
        </div>
        <div class="flex items-center gap-3">
          <a routerLink="/marketplace/orderbook" class="btn btn-ghost">
            <lucide-angular [img]="BarChart3Icon" class="w-4 h-4"></lucide-angular>
            Order Book
          </a>
          <a routerLink="/marketplace/new" class="btn btn-primary">
            <lucide-angular [img]="PlusIcon" class="w-4 h-4"></lucide-angular>
            Create Listing
          </a>
        </div>
      </div>

      <div class="card p-5">
        <div class="flex items-center gap-3">
          <div class="flex-1">
            <app-search-input
              [value]="searchQuery"
              placeholder="Search listings..."
              (search)="searchQuery = $event; page = 1; loadListings()"
            />
          </div>
          <select [(ngModel)]="statusFilter" (change)="page = 1; loadListings()" class="input">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="sold">Sold</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <app-loading-spinner
        *ngIf="loading"
        size="lg"
        label="Loading listings..."
      ></app-loading-spinner>

      <app-empty-state
        *ngIf="!loading && listings.length === 0"
        title="No listings found"
        message="There are no marketplace listings matching your criteria."
        actionLabel="Create Listing"
        (action)="router.navigate(['/marketplace/new'])"
      ></app-empty-state>

      <app-data-table
        *ngIf="!loading && listings.length > 0"
        [columns]="columns"
        [data]="listings"
        [loading]="false"
        [pagination]="pagination"
        (page)="onPageChange($event)"
      >
        <ng-template #row let-row let-col="column">
          <ng-container [ngSwitch]="col.key">
            <ng-template ngSwitchCase="projectName">
              <span class="font-medium text-slate-900 dark:text-white">{{ row.projectName }}</span>
            </ng-template>
            <ng-template ngSwitchCase="sellerName">
              <span class="text-slate-600 dark:text-slate-400">{{
                row.sellerName || (row.sellerId | stellarAddress)
              }}</span>
            </ng-template>
            <ng-template ngSwitchCase="amount">
              <span class="font-mono text-slate-700 dark:text-slate-300">{{
                row.amount | creditAmount
              }}</span>
            </ng-template>
            <ng-template ngSwitchCase="price">
              <span class="font-mono text-slate-700 dark:text-slate-300"
                >{{ row.price | numberAbbreviate }} XLM</span
              >
            </ng-template>
            <ng-template ngSwitchCase="totalValue">
              <span class="font-mono text-slate-700 dark:text-slate-300"
                >{{ row.totalValue | numberAbbreviate }} XLM</span
              >
            </ng-template>
            <ng-template ngSwitchCase="status">
              <app-status-badge [status]="row.status"></app-status-badge>
            </ng-template>
            <ng-template ngSwitchCase="createdAt">
              <span class="text-slate-500 dark:text-slate-400">{{
                row.createdAt | dateFormat: 'short'
              }}</span>
            </ng-template>
            <ng-template ngSwitchCase="actions">
              <button
                *ngIf="row.status === 'active'"
                (click)="buyListing(row)"
                class="btn btn-sm btn-primary"
              >
                Buy
              </button>
            </ng-template>
            <ng-template ngSwitchDefault>
              {{ row[col.key] }}
            </ng-template>
          </ng-container>
        </ng-template>
      </app-data-table>
    </div>
  `,
})
export class MarketplaceListingsComponent implements OnInit {
  protected readonly PlusIcon = Plus;
  protected readonly BarChart3Icon = BarChart3;

  listings: MarketplaceListing[] = [];
  loading = true;
  page = 1;
  limit = 10;
  pagination: { page: number; limit: number; total: number; totalPages: number } | null = null;
  statusFilter = '';
  projectFilter = '';
  searchQuery = '';
  projects: { id: string; name: string }[] = [];

  columns: ColumnDef<MarketplaceListing>[] = [
    { key: 'projectName', label: 'Project', sortable: true },
    { key: 'sellerName', label: 'Seller' },
    { key: 'amount', label: 'Amount', align: 'right' },
    { key: 'price', label: 'Price', align: 'right' },
    { key: 'totalValue', label: 'Total Value', align: 'right' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Created' },
    { key: 'actions', label: '', align: 'right' },
  ];

  constructor(
    private marketplaceService: MarketplaceService,
    private projectsService: ProjectsService,
    protected router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadListings(), this.loadProjects()]);
  }

  async loadListings(): Promise<void> {
    this.loading = true;
    try {
      const params: Record<string, any> = { page: this.page, limit: this.limit };
      if (this.statusFilter) params['status'] = this.statusFilter;
      if (this.projectFilter) params['projectId'] = this.projectFilter;
      if (this.searchQuery) params['search'] = this.searchQuery;
      const response = await this.marketplaceService.getListings(params);
      this.listings = response.data;
      this.pagination = {
        page: response.page,
        limit: this.limit,
        total: response.total,
        totalPages: response.totalPages,
      };
    } catch {
      this.listings = [];
      this.pagination = null;
    } finally {
      this.loading = false;
    }
  }

  async loadProjects(): Promise<void> {
    try {
      const response = await this.projectsService.getProjects({ limit: 100 });
      this.projects = response.data.map((p) => ({ id: p.id, name: p.name }));
    } catch {
      this.projects = [];
    }
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadListings();
  }

  filterByStatus(status: string): void {
    this.statusFilter = status;
    this.page = 1;
    this.loadListings();
  }

  filterByProject(projectId: string): void {
    this.projectFilter = projectId;
    this.page = 1;
    this.loadListings();
  }

  onSearch(term: string): void {
    this.searchQuery = term;
    this.page = 1;
    this.loadListings();
  }

  buyListing(listing: MarketplaceListing): void {
    this.router.navigate(['/marketplace', listing.id, 'buy']);
  }
}
