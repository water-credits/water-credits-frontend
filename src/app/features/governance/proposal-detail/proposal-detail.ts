import { Component, OnInit } from '@angular/core';
import { NgIf, NgClass } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule, ArrowLeft, ThumbsUp, ThumbsDown, CheckCircle, Clock, User, FileText } from 'lucide-angular';
import { GovernanceService } from '../../../core/services/governance.service';
import { NotificationService } from '../../../core/services/notification.service';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner';
import { DateFormatPipe } from '../../../shared/pipes/date-format.pipe';
import { DurationPipe } from '../../../shared/pipes/duration.pipe';
import { StellarAddressPipe } from '../../../shared/pipes/stellar-address.pipe';
import { NumberAbbreviatePipe } from '../../../shared/pipes/number-abbreviate.pipe';
import { Proposal, ProposalStatus, ProposalActionType } from '../../../core/models/proposal.model';

@Component({
  selector: 'app-proposal-detail',
  standalone: true,
  imports: [
    NgIf, NgClass, RouterLink,
    LucideAngularModule,
    StatusBadgeComponent, LoadingSpinnerComponent,
    DateFormatPipe, DurationPipe, StellarAddressPipe, NumberAbbreviatePipe,
  ],
  template: `
    <div class="max-w-3xl mx-auto space-y-6">
      <a routerLink="/governance" class="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
        <lucide-angular [img]="ArrowLeftIcon" class="w-4 h-4"></lucide-angular>
        Back to Governance
      </a>

      <div *ngIf="loading" class="flex justify-center py-16">
        <app-loading-spinner size="md" label="Loading proposal..."></app-loading-spinner>
      </div>

      <div *ngIf="!loading && !proposal">
        <p class="text-center text-slate-500 dark:text-slate-400 py-16">Proposal not found.</p>
      </div>

      <div *ngIf="!loading && proposal" class="space-y-6">
        <div class="card p-6">
          <div class="flex items-start justify-between gap-4 mb-4">
            <div>
              <div class="flex items-center gap-2 mb-2">
                <h1 class="text-xl font-bold text-slate-900 dark:text-white">{{ proposal.title }}</h1>
                <app-status-badge [status]="proposal.status"></app-status-badge>
              </div>
              <div class="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                <span class="inline-flex items-center gap-1.5">
                  <lucide-angular [img]="UserIcon" class="w-4 h-4"></lucide-angular>
                  {{ proposal.proposerName || (proposal.proposerId | stellarAddress) }}
                </span>
                <span class="inline-flex items-center gap-1.5">
                  <lucide-angular [img]="ClockIcon" class="w-4 h-4"></lucide-angular>
                  Deadline {{ proposal.deadline | duration }}
                </span>
                <span>{{ proposal.createdAt | dateFormat:'short' }}</span>
              </div>
            </div>
          </div>

          <div class="mb-6">
            <h3 class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Description</h3>
            <p class="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{{ proposal.description }}</p>
          </div>

          <div class="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <div>
              <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Action Type</p>
              <p class="font-medium text-slate-900 dark:text-white capitalize">{{ formatActionType(proposal.actionType) }}</p>
            </div>
            <div>
              <p class="text-xs text-slate-500 dark:text-slate-400 mb-1">Created</p>
              <p class="font-medium text-slate-900 dark:text-white">{{ proposal.createdAt | dateFormat }}</p>
            </div>
          </div>

          <div *ngIf="proposal.actionParams && getActionParamKeys(proposal).length > 0" class="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <h3 class="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Action Parameters</h3>
            <div class="space-y-2">
              <div *ngFor="let key of getActionParamKeys(proposal)" class="text-sm">
                <span class="text-slate-500 dark:text-slate-400 capitalize">{{ formatParamKey(key) }}:</span>
                <span class="ml-2 text-slate-900 dark:text-white font-medium">{{ proposal.actionParams[key] }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card p-6">
          <h3 class="text-sm font-semibold text-slate-900 dark:text-white mb-4">Vote Breakdown</h3>
          <div class="flex items-center gap-3 mb-2">
            <div class="flex-1 h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
              <div class="h-full bg-green-500 transition-all" [style.width.%]="forPercentage"></div>
              <div class="h-full bg-red-500 transition-all" [style.width.%]="againstPercentage"></div>
            </div>
          </div>
          <div class="flex justify-between text-sm">
            <div class="flex items-center gap-1.5">
              <lucide-angular [img]="ThumbsUpIcon" class="w-4 h-4 text-green-500"></lucide-angular>
              <span class="font-medium text-slate-900 dark:text-white">{{ proposal.votesFor | numberAbbreviate }}</span>
              <span class="text-slate-500 dark:text-slate-400">for</span>
            </div>
            <div class="flex items-center gap-1.5">
              <lucide-angular [img]="ThumbsDownIcon" class="w-4 h-4 text-red-500"></lucide-angular>
              <span class="font-medium text-slate-900 dark:text-white">{{ proposal.votesAgainst | numberAbbreviate }}</span>
              <span class="text-slate-500 dark:text-slate-400">against</span>
            </div>
          </div>
        </div>

        <div *ngIf="canVote" class="card p-6">
          <h3 class="text-sm font-semibold text-slate-900 dark:text-white mb-4">Cast Your Vote</h3>
          <div class="flex items-center gap-3">
            <button (click)="castVote('for')" [disabled]="voting" class="btn btn-success inline-flex items-center gap-2">
              <lucide-angular [img]="ThumbsUpIcon" class="w-4 h-4"></lucide-angular>
              Vote For
            </button>
            <button (click)="castVote('against')" [disabled]="voting" class="btn btn-danger inline-flex items-center gap-2">
              <lucide-angular [img]="ThumbsDownIcon" class="w-4 h-4"></lucide-angular>
              Vote Against
            </button>
            <span *ngIf="voting" class="text-sm text-slate-500">Processing...</span>
          </div>
        </div>

        <div *ngIf="canExecute" class="card p-6">
          <h3 class="text-sm font-semibold text-slate-900 dark:text-white mb-4">Execution</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 mb-4">This proposal has been approved and is ready for execution.</p>
          <button (click)="executeProposal()" [disabled]="executing" class="btn btn-primary inline-flex items-center gap-2">
            <lucide-angular [img]="CheckCircleIcon" class="w-4 h-4"></lucide-angular>
            {{ executing ? 'Executing...' : 'Execute Proposal' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class ProposalDetailComponent implements OnInit {
  protected readonly ArrowLeftIcon = ArrowLeft;
  protected readonly ThumbsUpIcon = ThumbsUp;
  protected readonly ThumbsDownIcon = ThumbsDown;
  protected readonly CheckCircleIcon = CheckCircle;
  protected readonly ClockIcon = Clock;
  protected readonly UserIcon = User;

  protected proposal: Proposal | null = null;
  protected loading = true;
  protected voting = false;
  protected executing = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private governanceService: GovernanceService,
    private notification: NotificationService,
  ) {}

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading = false;
      return;
    }
    await this.loadProposal(id);
  }

  async loadProposal(id: string): Promise<void> {
    try {
      this.proposal = await this.governanceService.getProposal(id);
    } catch {
      this.proposal = null;
    } finally {
      this.loading = false;
    }
  }

  get forPercentage(): number {
    if (!this.proposal) return 0;
    const total = this.proposal.votesFor + this.proposal.votesAgainst;
    if (total === 0) return 50;
    return (this.proposal.votesFor / total) * 100;
  }

  get againstPercentage(): number {
    if (!this.proposal) return 0;
    const total = this.proposal.votesFor + this.proposal.votesAgainst;
    if (total === 0) return 50;
    return (this.proposal.votesAgainst / total) * 100;
  }

  get canVote(): boolean {
    return this.proposal?.status === ProposalStatus.PENDING || this.proposal?.status === ProposalStatus.ACTIVE;
  }

  get canExecute(): boolean {
    return this.proposal?.status === ProposalStatus.APPROVED;
  }

  getActionParamKeys(proposal: Proposal): string[] {
    return Object.keys(proposal.actionParams || {});
  }

  formatParamKey(key: string): string {
    return key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
  }

  formatActionType(type: ProposalActionType): string {
    const map: Record<string, string> = {
      [ProposalActionType.UPDATE_FEE]: 'Update Fee',
      [ProposalActionType.UPDATE_CONFIG]: 'Update Config',
      [ProposalActionType.ADD_MEMBER]: 'Add Member',
      [ProposalActionType.REMOVE_MEMBER]: 'Remove Member',
      [ProposalActionType.UPGRADE_CONTRACT]: 'Upgrade Contract',
    };
    return map[type] || type;
  }

  async castVote(vote: 'for' | 'against'): Promise<void> {
    if (!this.proposal || this.voting) return;
    this.voting = true;
    try {
      await this.governanceService.vote(this.proposal.id, vote);
      this.notification.success('Vote cast', `You voted ${vote} on "${this.proposal.title}"`);
      await this.loadProposal(this.proposal.id);
    } catch (err: any) {
      this.notification.error('Vote failed', err?.message || 'Unable to cast vote');
    } finally {
      this.voting = false;
    }
  }

  async executeProposal(): Promise<void> {
    if (!this.proposal || this.executing) return;
    this.executing = true;
    try {
      await this.governanceService.execute(this.proposal.id);
      this.notification.success('Proposal executed', `"${this.proposal.title}" has been executed`);
      await this.loadProposal(this.proposal.id);
    } catch (err: any) {
      this.notification.error('Execution failed', err?.message || 'Unable to execute proposal');
    } finally {
      this.executing = false;
    }
  }
}
