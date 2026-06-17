import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, ArrowLeft, Send, Loader } from 'lucide-angular';
import { GovernanceService } from '../../../core/services/governance.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ProposalActionType, GovernanceConfig } from '../../../core/models/proposal.model';

@Component({
  selector: 'app-proposal-form',
  standalone: true,
  imports: [
    NgIf, NgFor, FormsModule, RouterLink,
    LucideAngularModule,
  ],
  template: `
    <div class="max-w-2xl mx-auto space-y-6">
      <a routerLink="/governance" class="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
        <lucide-angular [img]="ArrowLeftIcon" class="w-4 h-4"></lucide-angular>
        Back to Governance
      </a>

      <div class="card p-6">
        <h1 class="text-xl font-bold text-slate-900 dark:text-white mb-6">Create New Proposal</h1>

        <form (ngSubmit)="onSubmit()" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Title</label>
            <input
              type="text"
              [(ngModel)]="title"
              name="title"
              required
              placeholder="Enter a descriptive title for your proposal"
              class="input w-full"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
            <textarea
              [(ngModel)]="description"
              name="description"
              required
              rows="4"
              placeholder="Provide a detailed explanation of your proposal"
              class="input w-full resize-none"
            ></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Action Type</label>
            <select
              [(ngModel)]="selectedActionType"
              name="actionType"
              required
              (ngModelChange)="onActionTypeChange()"
              class="input w-full"
            >
              <option value="" disabled selected>Select an action type</option>
              <option *ngFor="let opt of actionTypeOptions" [value]="opt.value">{{ opt.label }}</option>
            </select>
          </div>

          <div *ngIf="selectedActionType === ProposalActionType.UPDATE_FEE" class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-4">
            <h3 class="text-sm font-semibold text-slate-900 dark:text-white">Update Fee Parameters</h3>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Protocol Fee (%)</label>
              <input
                type="number"
                [(ngModel)]="actionParams.fee"
                name="fee"
                placeholder="e.g. 2"
                class="input w-full"
              />
            </div>
          </div>

          <div *ngIf="selectedActionType === ProposalActionType.UPDATE_CONFIG" class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-4">
            <h3 class="text-sm font-semibold text-slate-900 dark:text-white">Update Configuration</h3>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Vote Duration (hours)</label>
              <input
                type="number"
                [(ngModel)]="actionParams.voteDuration"
                name="voteDuration"
                placeholder="e.g. 72"
                class="input w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Timelock Duration (hours)</label>
              <input
                type="number"
                [(ngModel)]="actionParams.timelockDuration"
                name="timelockDuration"
                placeholder="e.g. 24"
                class="input w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Quorum Threshold (%)</label>
              <input
                type="number"
                [(ngModel)]="actionParams.quorumThreshold"
                name="quorumThreshold"
                placeholder="e.g. 51"
                class="input w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Min Oracle Threshold</label>
              <input
                type="number"
                [(ngModel)]="actionParams.minOracleThreshold"
                name="minOracleThreshold"
                placeholder="e.g. 3"
                class="input w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Quality Penalty Weight</label>
              <input
                type="number"
                [(ngModel)]="actionParams.qualityPenaltyWeight"
                name="qualityPenaltyWeight"
                placeholder="e.g. 2"
                class="input w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">N-Removal Weight</label>
              <input
                type="number"
                [(ngModel)]="actionParams.nRemovalWeight"
                name="nRemovalWeight"
                placeholder="e.g. 1"
                class="input w-full"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">P-Removal Weight</label>
              <input
                type="number"
                [(ngModel)]="actionParams.pRemovalWeight"
                name="pRemovalWeight"
                placeholder="e.g. 1"
                class="input w-full"
              />
            </div>
          </div>

          <div *ngIf="selectedActionType === ProposalActionType.ADD_MEMBER || selectedActionType === ProposalActionType.REMOVE_MEMBER" class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-4">
            <h3 class="text-sm font-semibold text-slate-900 dark:text-white">
              {{ selectedActionType === ProposalActionType.ADD_MEMBER ? 'Add Member' : 'Remove Member' }}
            </h3>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Member Address</label>
              <input
                type="text"
                [(ngModel)]="actionParams.address"
                name="memberAddress"
                placeholder="G..."
                class="input w-full font-mono"
              />
            </div>
          </div>

          <div *ngIf="selectedActionType === ProposalActionType.UPGRADE_CONTRACT" class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-4">
            <h3 class="text-sm font-semibold text-slate-900 dark:text-white">Upgrade Contract</h3>
            <div>
              <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">New Contract Address</label>
              <input
                type="text"
                [(ngModel)]="actionParams.contractAddress"
                name="contractAddress"
                placeholder="C..."
                class="input w-full font-mono"
              />
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <a routerLink="/governance" class="btn btn-ghost">Cancel</a>
            <button
              type="submit"
              [disabled]="isSubmitting || !isFormValid"
              class="btn btn-primary inline-flex items-center gap-2"
            >
              <lucide-angular *ngIf="!isSubmitting" [img]="SendIcon" class="w-4 h-4"></lucide-angular>
              <lucide-angular *ngIf="isSubmitting" [img]="LoaderIcon" class="w-4 h-4 animate-spin"></lucide-angular>
              {{ isSubmitting ? 'Submitting...' : 'Submit Proposal' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class ProposalFormComponent implements OnInit {
  protected readonly ArrowLeftIcon = ArrowLeft;
  protected readonly SendIcon = Send;
  protected readonly LoaderIcon = Loader;
  protected readonly ProposalActionType = ProposalActionType;

  protected title: string = '';
  protected description: string = '';
  protected selectedActionType: string = '';
  protected actionParams: Record<string, any> = {};
  protected isSubmitting = false;

  protected readonly actionTypeOptions = [
    { label: 'Update Fee', value: ProposalActionType.UPDATE_FEE },
    { label: 'Update Config', value: ProposalActionType.UPDATE_CONFIG },
    { label: 'Add Member', value: ProposalActionType.ADD_MEMBER },
    { label: 'Remove Member', value: ProposalActionType.REMOVE_MEMBER },
    { label: 'Upgrade Contract', value: ProposalActionType.UPGRADE_CONTRACT },
  ];

  constructor(
    private governanceService: GovernanceService,
    private notification: NotificationService,
    private router: Router,
  ) {}

  ngOnInit(): void {}

  onActionTypeChange(): void {
    this.actionParams = {};
  }

  get isFormValid(): boolean {
    if (!this.title.trim() || !this.description.trim() || !this.selectedActionType) return false;
    return true;
  }

  async onSubmit(): Promise<void> {
    if (!this.isFormValid || this.isSubmitting) return;

    this.isSubmitting = true;
    try {
      const proposal = await this.governanceService.createProposal({
        title: this.title.trim(),
        description: this.description.trim(),
        actionType: this.selectedActionType,
        actionParams: this.actionParams,
      });
      this.notification.success('Proposal created', 'Your proposal has been submitted successfully');
      this.router.navigate(['/governance', proposal.id]);
    } catch (err: any) {
      this.notification.error('Failed to create proposal', err?.message || 'An unexpected error occurred');
    } finally {
      this.isSubmitting = false;
    }
  }
}
