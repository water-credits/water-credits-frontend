import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor, AsyncPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { LucideAngularModule, ArrowLeft, Send, Loader } from 'lucide-angular';
import { ProposalActionType } from '../../../core/models/proposal.model';
import * as GovernanceActions from '../../../core/store/governance/governance.actions';
import { selectGovernanceCreating } from '../../../core/store/governance/governance.selectors';

@Component({
  selector: 'app-proposal-form',
  standalone: true,
  imports: [NgIf, NgFor, AsyncPipe, ReactiveFormsModule, RouterLink, LucideAngularModule],
  template: `
    <div class="max-w-2xl mx-auto space-y-6">
      <a
        routerLink="/governance"
        class="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
      >
        <lucide-angular [img]="ArrowLeftIcon" class="w-4 h-4"></lucide-angular>
        Back to Governance
      </a>

      <div class="card p-6">
        <h1 class="text-xl font-bold text-slate-900 dark:text-white mb-6">Create New Proposal</h1>

        <form [formGroup]="proposalForm" (ngSubmit)="onSubmit()" class="space-y-6">
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >Title</label
            >
            <input
              type="text"
              formControlName="title"
              placeholder="Enter a descriptive title for your proposal"
              class="input w-full"
              [class.border-red-500]="titleControl?.invalid && titleControl?.touched"
            />
            <div
              *ngIf="titleControl?.invalid && titleControl?.touched"
              class="text-red-500 text-xs mt-1"
            >
              Title is required (max 100 characters).
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >Description</label
            >
            <textarea
              formControlName="description"
              rows="4"
              placeholder="Provide a detailed explanation of your proposal (Markdown supported)"
              class="input w-full resize-none"
              [class.border-red-500]="descControl?.invalid && descControl?.touched"
            ></textarea>
            <div
              *ngIf="descControl?.invalid && descControl?.touched"
              class="text-red-500 text-xs mt-1"
            >
              Description is required (max 2000 characters).
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >Parameter to Change</label
            >
            <select
              formControlName="parameterToChange"
              class="input w-full"
              [class.border-red-500]="paramControl?.invalid && paramControl?.touched"
            >
              <option value="" disabled>Select a parameter to change</option>
              <option *ngFor="let opt of parameterOptions" [value]="opt.value">
                {{ opt.label }}
              </option>
            </select>
            <div
              *ngIf="paramControl?.invalid && paramControl?.touched"
              class="text-red-500 text-xs mt-1"
            >
              Please select a parameter to change.
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >Proposed Value</label
            >
            <input
              type="number"
              formControlName="proposedValue"
              placeholder="Enter the proposed new value"
              class="input w-full"
              [class.border-red-500]="valueControl?.invalid && valueControl?.touched"
            />
            <div
              *ngIf="valueControl?.invalid && valueControl?.touched"
              class="text-red-500 text-xs mt-1"
            >
              Proposed value is required.
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >Voting Period (Days)</label
            >
            <input
              type="number"
              formControlName="votingPeriod"
              placeholder="e.g. 7"
              class="input w-full"
              [class.border-red-500]="periodControl?.invalid && periodControl?.touched"
            />
            <div
              *ngIf="periodControl?.invalid && periodControl?.touched"
              class="text-red-500 text-xs mt-1"
            >
              Voting period is required (minimum 1 day).
            </div>
          </div>

          <div
            class="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700"
          >
            <a routerLink="/governance" class="btn btn-ghost">Cancel</a>
            <button
              type="submit"
              [disabled]="(isSubmitting$ | async) || proposalForm.invalid"
              class="btn btn-primary inline-flex items-center gap-2"
            >
              <lucide-angular
                *ngIf="!(isSubmitting$ | async)"
                [img]="SendIcon"
                class="w-4 h-4"
              ></lucide-angular>
              <lucide-angular
                *ngIf="isSubmitting$ | async"
                [img]="LoaderIcon"
                class="w-4 h-4 animate-spin"
              ></lucide-angular>
              {{ (isSubmitting$ | async) ? 'Submitting...' : 'Submit Proposal' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class ProposalFormComponent implements OnInit {
  protected readonly ArrowLeftIcon = ArrowLeft;
  protected readonly SendIcon = Send;
  protected readonly LoaderIcon = Loader;

  protected proposalForm: FormGroup;
  protected isSubmitting$: Observable<boolean>;

  protected readonly parameterOptions = [
    { label: 'Protocol Fee (%)', value: 'protocolFee' },
    { label: 'Vote Duration (hours)', value: 'voteDuration' },
    { label: 'Timelock Duration (hours)', value: 'timelockDuration' },
    { label: 'Quorum Threshold (%)', value: 'quorumThreshold' },
    { label: 'Min Oracle Threshold', value: 'minOracleThreshold' },
    { label: 'Quality Penalty Weight', value: 'qualityPenaltyWeight' },
    { label: 'N-Removal Weight', value: 'nRemovalWeight' },
    { label: 'P-Removal Weight', value: 'pRemovalWeight' },
  ];

  constructor(
    private fb: FormBuilder,
    private store: Store,
  ) {
    this.isSubmitting$ = this.store.select(selectGovernanceCreating);

    this.proposalForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(2000)]],
      parameterToChange: ['', Validators.required],
      proposedValue: ['', Validators.required],
      votingPeriod: [null, [Validators.required, Validators.min(1)]],
    });
  }

  ngOnInit(): void {}

  get titleControl() {
    return this.proposalForm.get('title');
  }

  get descControl() {
    return this.proposalForm.get('description');
  }

  get paramControl() {
    return this.proposalForm.get('parameterToChange');
  }

  get valueControl() {
    return this.proposalForm.get('proposedValue');
  }

  get periodControl() {
    return this.proposalForm.get('votingPeriod');
  }

  onSubmit(): void {
    if (this.proposalForm.invalid) return;

    const { title, description, parameterToChange, proposedValue, votingPeriod } =
      this.proposalForm.value;

    const actionType =
      parameterToChange === 'protocolFee'
        ? ProposalActionType.UPDATE_FEE
        : ProposalActionType.UPDATE_CONFIG;

    const actionParams: Record<string, string | number | boolean> = {
      votingPeriod,
    };

    if (parameterToChange === 'protocolFee') {
      actionParams['fee'] = proposedValue;
    } else {
      actionParams[parameterToChange] = proposedValue;
    }

    this.store.dispatch(
      GovernanceActions.createProposal({
        data: {
          title: title.trim(),
          description: description.trim(),
          actionType,
          actionParams,
        },
      }),
    );
  }
}
