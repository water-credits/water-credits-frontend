import { Directive, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({ selector: '[appClickOutside]', standalone: true })
export class ClickOutsideDirective {
  @Output() appClickOutside = new EventEmitter<void>();

  constructor(private el: ElementRef<HTMLElement>) {}

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target as HTMLElement)) {
      this.appClickOutside.emit();
    }
  }
}
