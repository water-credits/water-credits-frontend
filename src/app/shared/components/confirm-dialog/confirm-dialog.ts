import {
  Component,
  Input,
  Output,
  EventEmitter,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  HostListener,
} from '@angular/core';
import { LucideAngularModule, X, AlertTriangle } from 'lucide-angular';

let nextDialogId = 0;

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [LucideAngularModule],
  template: `
    <div
      role="dialog"
      aria-modal="true"
      [attr.aria-labelledby]="titleId"
      [attr.aria-describedby]="messageId"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      (click)="cancel.emit()"
    >
      <div
        class="bg-white dark:bg-dark-bg-lighter rounded-xl shadow-2xl max-w-md w-full mx-4 p-6"
        (click)="$event.stopPropagation()"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <lucide-angular
              [img]="AlertTriangleIcon"
              class="w-6 h-6 text-yellow-500"
            ></lucide-angular>
            <h3 [id]="titleId" class="text-lg font-semibold text-slate-900 dark:text-white">
              {{ title }}
            </h3>
          </div>
          <button
            (click)="cancel.emit()"
            class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <lucide-angular [img]="XIcon" class="w-5 h-5"></lucide-angular>
          </button>
        </div>
        <p [id]="messageId" class="text-sm text-slate-600 dark:text-slate-400 mb-6">{{ message }}</p>
        <div class="flex justify-end gap-3">
          <button (click)="cancel.emit()" class="btn btn-outline">{{ cancelLabel }}</button>
          <button (click)="confirm.emit()" [class]="confirmClass">{{ confirmLabel }}</button>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent implements AfterViewInit, OnDestroy {
  @Input() title = 'Confirm action';
  @Input() message = 'Are you sure?';
  @Input() confirmLabel = 'Confirm';
  @Input() cancelLabel = 'Cancel';
  @Input() confirmVariant: 'primary' | 'danger' = 'primary';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  protected readonly AlertTriangleIcon = AlertTriangle;
  protected readonly XIcon = X;

  protected readonly titleId = `confirm-dialog-title-${++nextDialogId}`;
  protected readonly messageId = `confirm-dialog-message-${nextDialogId}`;

  private previouslyFocused: HTMLElement | null = null;
  private focusable: HTMLElement[] = [];

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  get confirmClass(): string {
    return this.confirmVariant === 'danger' ? 'btn btn-danger' : 'btn btn-primary';
  }

  ngAfterViewInit(): void {
    this.previouslyFocused = document.activeElement as HTMLElement | null;
    this.focusable = Array.from(
      this.elementRef.nativeElement.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    );
    this.focusable[0]?.focus();
  }

  ngOnDestroy(): void {
    this.previouslyFocused?.focus();
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancel.emit();
      return;
    }
    if (event.key !== 'Tab' || this.focusable.length === 0) return;
    const first = this.focusable[0];
    const last = this.focusable[this.focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}