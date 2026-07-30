import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { LucideAngularModule, X, AlertTriangle } from 'lucide-angular';
import { FocusTrapDirective } from '../../directives/focus-trap.directive';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [LucideAngularModule, FocusTrapDirective],
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      aria-hidden="true"
      (click)="cancel.emit()"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        appFocusTrap
        class="bg-white dark:bg-dark-bg-lighter rounded-xl shadow-2xl max-w-md w-full mx-4 p-6"
        (click)="$event.stopPropagation()"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <lucide-angular
              [img]="AlertTriangleIcon"
              class="w-6 h-6 text-yellow-500"
              aria-hidden="true"
            ></lucide-angular>
            <h3 id="confirm-dialog-title" class="text-lg font-semibold text-slate-900 dark:text-white">{{ title }}</h3>
          </div>
          <button
            (click)="cancel.emit()"
            class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            aria-label="Close dialog"
            type="button"
          >
            <lucide-angular [img]="XIcon" class="w-5 h-5" aria-hidden="true"></lucide-angular>
          </button>
        </div>
        <p id="confirm-dialog-desc" class="text-sm text-slate-600 dark:text-slate-400 mb-6">{{ message }}</p>
        <div class="flex justify-end gap-3">
          <button (click)="cancel.emit()" class="btn btn-outline" type="button">{{ cancelLabel }}</button>
          <button (click)="confirm.emit()" [class]="confirmClass" type="button">{{ confirmLabel }}</button>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  @Input() title = 'Confirm action';
  @Input() message = 'Are you sure?';
  @Input() confirmLabel = 'Confirm';
  @Input() cancelLabel = 'Cancel';
  @Input() confirmVariant: 'primary' | 'danger' = 'primary';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  protected readonly AlertTriangleIcon = AlertTriangle;
  protected readonly XIcon = X;

  /** Close dialog on Escape key (WCAG 2.1.2) */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.cancel.emit();
  }

  get confirmClass(): string {
    return this.confirmVariant === 'danger' ? 'btn btn-danger' : 'btn btn-primary';
  }
}
