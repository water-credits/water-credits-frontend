import {
  AfterViewInit,
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
} from '@angular/core';

/**
 * FocusTrapDirective — traps keyboard focus within the host element.
 *
 * Usage:
 *   <div appFocusTrap>...</div>
 *   <div [appFocusTrap]="isOpen">...</div>
 *
 * When enabled (the default), Tab and Shift+Tab cycle within the element
 * and focus is moved to the first focusable child on init.
 *
 * Restore focus to the element that had focus before the trap was activated
 * by setting [restoreFocus]="true" (default: true).
 */
@Directive({
  selector: '[appFocusTrap]',
  standalone: true,
})
export class FocusTrapDirective implements AfterViewInit, OnDestroy {
  /** Pass `false` to temporarily disable the trap without removing the directive. */
  @Input('appFocusTrap') enabled: boolean | '' = true;
  /** Restore focus to the previously focused element when destroyed. */
  @Input() restoreFocus = true;

  private previouslyFocused: HTMLElement | null = null;

  private readonly FOCUSABLE_SELECTORS = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    'details > summary',
  ].join(', ');

  constructor(private el: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    if (this.isEnabled) {
      this.activate();
    }
  }

  ngOnDestroy(): void {
    if (this.restoreFocus && this.previouslyFocused) {
      this.previouslyFocused.focus();
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled || event.key !== 'Tab') return;

    const focusable = this.focusableElements;
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey) {
      // Shift+Tab: if focus is on the first element, wrap to last
      if (document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    } else {
      // Tab: if focus is on the last element, wrap to first
      if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  private get isEnabled(): boolean {
    return this.enabled === '' || this.enabled === true;
  }

  private activate(): void {
    // Remember who had focus before the trap
    this.previouslyFocused = document.activeElement as HTMLElement;
    // Move focus into the trap
    const first = this.focusableElements[0];
    if (first) {
      first.focus();
    }
  }

  private get focusableElements(): HTMLElement[] {
    return Array.from(
      this.el.nativeElement.querySelectorAll<HTMLElement>(this.FOCUSABLE_SELECTORS),
    ).filter((el) => !el.closest('[hidden]') && !el.closest('[aria-hidden="true"]'));
  }
}
