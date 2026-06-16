import { Directive, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Directive({ selector: '[appCopyToClipboard]', standalone: true })
export class CopyToClipboardDirective {
  @Input('appCopyToClipboard') text: string = '';
  @Output() copied = new EventEmitter<void>();

  @HostListener('click') onClick(): void {
    if (!this.text) return;
    navigator.clipboard.writeText(this.text).then(() => {
      this.copied.emit();
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = this.text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      this.copied.emit();
    });
  }
}
