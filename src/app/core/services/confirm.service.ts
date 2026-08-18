import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type ConfirmVariant = 'primary' | 'danger';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  confirmVariant: ConfirmVariant;
}

export interface ConfirmRequest extends ConfirmOptions {
  resolve: (result: boolean) => void;
}

/**
 * Renders a ConfirmDialogComponent via the ConfirmOutletComponent and
 * resolves with the user's choice. Replaces blocking window.confirm calls
 * with a styleable, testable async flow.
 */
@Injectable({
  providedIn: 'root',
})
export class ConfirmService {
  private requestSubject = new Subject<ConfirmRequest>();
  public requests$ = this.requestSubject.asObservable();

  confirm(options: Partial<ConfirmOptions> = {}): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.requestSubject.next({
        title: options.title ?? 'Confirm action',
        message: options.message ?? 'Are you sure?',
        confirmLabel: options.confirmLabel ?? 'Confirm',
        cancelLabel: options.cancelLabel ?? 'Cancel',
        confirmVariant: options.confirmVariant ?? 'primary',
        resolve,
      });
    });
  }
}
