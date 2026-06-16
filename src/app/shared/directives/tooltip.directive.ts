import { Directive, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';

@Directive({ selector: '[appTooltip]', standalone: true })
export class TooltipDirective {
  @Input('appTooltip') tooltipText: string = '';
  private tooltipEl: HTMLElement | null = null;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('mouseenter') onMouseEnter(): void {
    if (!this.tooltipText) return;
    this.tooltipEl = this.renderer.createElement('div');
    const text = this.renderer.createText(this.tooltipText);
    this.renderer.appendChild(this.tooltipEl, text);
    this.renderer.addClass(this.tooltipEl, 'tooltip');
    this.renderer.setStyle(this.tooltipEl, 'position', 'absolute');
    this.renderer.setStyle(this.tooltipEl, 'background', '#1E293B');
    this.renderer.setStyle(this.tooltipEl, 'color', 'white');
    this.renderer.setStyle(this.tooltipEl, 'padding', '4px 8px');
    this.renderer.setStyle(this.tooltipEl, 'border-radius', '6px');
    this.renderer.setStyle(this.tooltipEl, 'font-size', '12px');
    this.renderer.setStyle(this.tooltipEl, 'white-space', 'nowrap');
    this.renderer.setStyle(this.tooltipEl, 'z-index', '1000');
    this.renderer.setStyle(this.tooltipEl, 'pointer-events', 'none');
    this.renderer.appendChild(this.el.nativeElement, this.tooltipEl);
  }

  @HostListener('mouseleave') onMouseLeave(): void {
    if (this.tooltipEl) {
      this.renderer.removeChild(this.el.nativeElement, this.tooltipEl);
      this.tooltipEl = null;
    }
  }
}
