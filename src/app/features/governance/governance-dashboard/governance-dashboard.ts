import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, Plus, Clock, Users, Vote, TrendingUp, Scale, Shield, Activity } from 'lucide-angular';
import { GovernanceService } from '../../../core/services/governance.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import { DurationPipe } from '../../../shared/pipes/duration.pipe';
import { StellarAddressPipe } from '../../../shared/pipes/stellar-address.pipe';
import { NumberAbbreviatePipe } from '../../../shared/pipes/number-abbreviate.pipe';
import { Proposal, ProposalStatus, GovernanceConfig } from '../../../core/models/proposal.model';

@Component({
  selector: 'app-governance-dashboard',
  standalone: true,
  imports: [
    NgIf, NgFor, NgClass, RouterLink,
    LucideAngularModule,
    StatusBadgeComponent, LoadingSpinnerComponent, EmptyStateComponent,
    DateFormatPipe, DurationPipe, StellarAddressPipe, NumberAbbreviatePipe,
  ],
  template: `
    <div class="space-y-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Governance</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage protocol parameters and membership</p>
        </div>
        <a routerLink="/governance/new" class="btn btn-primary inline-flex items-center gap-2">
          <lucide-angular [img]="PlusIcon" class="w-4 h-4"></lucide-angular>
          New Proposal
        </a>
      </div>

      <div *ngIf="loadingConfig && !config" class="flex justify-center py-8">
        <app-loading-spinner size="md" label="Loading configuration..."></app-loading-spinner>
      </div>

      <div *ngIf="config" class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="card p-4">
          <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
            <lucide-angular [img]="ScaleIcon" class="w-3.5 h-3.5"></lucide-angular>
            <span>Protocol Fee</span>
          </div>
          <p class="text-lg font-semibold text-slate-900 dark:text-white">{{ config.protocolFee }}%</p>
        </div>
        <div class="card p-4">
          <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
            <lucide-angular [img]="ClockIcon" class="w-3.5 h-3.5"></lucide-angular>
            <span>Vote Duration</span>
          </div>
          <p class="text-lg font-semibold text-slate-900 dark:text-white">{{ config.voteDuration }}h</p>
        </div>
        <div class="card p-4">
          <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
            <lucide-angular [img]="ShieldIcon" class="w-3.5 h-3.5"></lucide-angular>
            <span>Timelock</span>
          </div>
          <p class="text-lg font-semibold text-slate-900 dark:text-white">{{ config.timelockDuration }}h</p>
        </div>
        <div class="card p-4">
          <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
            <lucide-angular [img]="TrendingUpIcon" class="w-3.5 h-3.5"></lucide-angular>
            <span>Quorum</span>
          </div>
          <p class="text-lg font-semibold text-slate-900 dark:text-white">{{ config.quorumThreshold }}%</p>
        </div>
        <div class="card p-4">
          <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
            <lucide-angular [img]="ActivityIcon" class="w-3.5 h-3.5"></lucide-angular>
            <span>Oracle Threshold</span>
          </div>
          <p class="text-lg font-semibold text-slate-900 dark:text-white">{{ config.minOracleThreshold }}</p>
        </div>
        <div class="card p-4">
          <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
            <lucide-angular [img]="UsersIcon" class="w-3.5 h-3.5"></lucide-angular>
            <span>Quality Penalty</span>
          </div>
          <p class="text-lg font-semibold text-slate-900 dark:text-white">{{ config.qualityPenaltyWeight }}</p>
        </div>
        <div class="card p-4">
          <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
            <lucide-angular [img]="VoteIcon" class="w-3.5 h-3.5"></lucide-angular>
            <span>N-Removal Weight</span>
          </div>
          <p class="text-lg font-semibold text-slate-900 dark:text-white">{{ config.nRemovalWeight }}</p>
        </div>
        <div class="card p-4">
          <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
            <lucide-angular [img]="VoteIcon" class="w-3.5 h-3.5"></lucide-angular>
            <span>P-Removal Weight</span>
          </div>
          <p class="text-lg font-semibold text-slate-900 dark:text-white">{{ config.pRemovalWeight }}</p>
        </div>
      </div>

      <div class="card">
        <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div class="flex items-center gap-2 overflow-x-auto">
            <button *ngFor="let tab of statusTabs" (click)="selectedStatus = tab.value"
              [ngClass]="{
                'bg-stellar-blue text-white': selectedStatus === tab.value,
                'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600': selectedStatus !== tab.value
              }"
              class="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
              {{ tab.label }}
            </button>
          </div>
        </div>

        <div *ngIf="loadingProposals" class="flex justify-center py-12">
          <app-loading-spinner size="md" label="Loading proposals..."></app-loading-spinner>
        </div>

        <div *ngIf="!loadingProposals && filteredProposals.length === 0">
          <app-empty-state
            title="No proposals found"
            message="There are no proposals matching the selected filter."
            [actionLabel]="selectedStatus ? 'View all proposals' : 'Create your first proposal'"
            (action)="selectedStatus ? (selectedStatus = '') : undefined"
          ></app-empty-state>
        </div>

        <div *ngIf="!loadingProposals && filteredProposals.length > 0" class="divide-y divide-slate-100 dark:divide-slate-700/50">
          <div *ngFor="let proposal of filteredProposals"
            class="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
            (click)="goToProposal(proposal.id)">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1.5">
                  <h3 class="font-medium text-slate-900 dark:text-white truncate">{{ proposal.title }}</h3>
                  <app-status-badge [status]="proposal.status" class="shrink-0"></app-status-badge>
                </div>
                <div class="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span>{{ proposal.proposerName || (proposal.proposerId | stellarAddress) }}</span>
                  <span class="inline-flex items-center gap-1">
                    <lucide-angular [img]="ClockIcon" class="w-3 h-3"></lucide-angular>
                    <span>{{ proposal.deadline | duration }} left</span>
                  </span>
                  <span>{{ proposal.createdAt | dateFormat:'relative' }}</span>
                </div>
              </div>
              <div class="text-right shrink-0">
                <p class="text-sm font-semibold text-slate-900 dark:text-white">{{ proposal.votesFor | numberAbbreviate }}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">for</p>
              </div>
            </div>
            <div class="mt-3 flex items-center gap-2">
              <div class="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div class="h-full bg-green-500 rounded-full transition-all" [style.width.%]="getVoteRatio(proposal)"></div>
              </div>
              <span class="text-xs text-slate-500 dark:text-slate-400 shrink-0">{{ proposal.votesAgainst | numberAbbreviate }} against</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class GovernanceDashboardComponent implements OnInit {
  protected readonly PlusIcon = Plus;
  protected readonly ClockIcon = Clock;
  protected readonly UsersIcon = Users;
  protected readonly VoteIcon = Vote;
  protected readonly TrendingUpIcon = TrendingUp;
  protected readonly ScaleIcon = Scale;
  protected readonly ShieldIcon = Shield;
  protected readonly ActivityIcon = Activity;

  protected config: GovernanceConfig | null = null;
  protected proposals: Proposal[] = [];
  protected loadingConfig = true;
  protected loadingProposals = true;
  protected selectedStatus: string = '';

  protected readonly statusTabs = [
    { label: 'All', value: '' },
    { label: 'Active', value: ProposalStatus.ACTIVE },
    { label: 'Approved', value: ProposalStatus.APPROVED },
    { label: 'Rejected', value: ProposalStatus.REJECTED },
    { label: 'Expired', value: ProposalStatus.EXPIRED },
    { label: 'Executed', value: ProposalStatus.EXECUTED },
  ];

  constructor(
    private governanceService: GovernanceService,
    private router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    await Promise.all([this.loadConfig(), this.loadProposals()]);
  }

  async loadConfig(): Promise<void> {
    try {
      this.config = await this.governanceService.getConfig();
    } catch {
      this.config = null;
    } finally {
      this.loadingConfig = false;
    }
  }

  async loadProposals(): Promise<void> {
    try {
      const res = await this.governanceService.getProposals({ limit: 50 });
      this.proposals = res.data || [];
    } catch {
      this.proposals = [];
    } finally {
      this.loadingProposals = false;
    }
  }

  get filteredProposals(): Proposal[] {
    if (!this.selectedStatus) return this.proposals;
    return this.proposals.filter(p => p.status === this.selectedStatus);
  }

  getVoteRatio(proposal: Proposal): number {
    const total = proposal.votesFor + proposal.votesAgainst;
    if (total === 0) return 0;
    return (proposal.votesFor / total) * 100;
  }

  goToProposal(id: string): void {
    this.router.navigate(['/governance', id]);
  }
}
