import { Component, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { NgIf } from '@angular/common';
import { Subscription } from 'rxjs';
import { ConfirmService, ConfirmRequest } from '../../../core/services/confirm.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-confirm-outlet',
  standalone: true,
  imports: [NgIf, ConfirmDialogComponent],
  template: `
    <app-confirm-dialog
      *ngIf="request"
      [title]="request.title"
      [message]="request.message"
      [confirmLabel]="request.confirmLabel"
      [cancelLabel]="request.cancelLabel"
      [confirmVariant]="request.confirmVariant"
      (confirm)="resolve(true)"
      (cancel)="resolve(false)"
    ></app-confirm-dialog>
  `,
})
export class ConfirmOutletComponent implements OnDestroy {
  protected request: ConfirmRequest | null = null;
  private subscription: Subscription;

  constructor(
    private confirmService: ConfirmService,
    private cdr: ChangeDetectorRef,
  ) {
    this.subscription = this.confirmService.requests$.subscribe((request) => {
      this.request = request;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  protected resolve(result: boolean): void {
    this.request?.resolve(result);
    this.request = null;
    this.cdr.markForCheck();
  }
}
