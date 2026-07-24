import { Directive, EventEmitter, HostListener, Output } from '@angular/core';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

@Directive({ selector: '[appSwipe]', standalone: true })
export class SwipeDirective {
  @Output() appSwipe = new EventEmitter<SwipeDirection>();

  private startX = 0;
  private startY = 0;
  private readonly THRESHOLD = 50;

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    this.startX = event.touches[0].clientX;
    this.startY = event.touches[0].clientY;
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    const endX = event.changedTouches[0].clientX;
    const endY = event.changedTouches[0].clientY;
    const dx = endX - this.startX;
    const dy = endY - this.startY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) < this.THRESHOLD) {
      return;
    }

    if (absDx > absDy) {
      this.appSwipe.emit(dx > 0 ? 'right' : 'left');
    } else {
      this.appSwipe.emit(dy > 0 ? 'down' : 'up');
    }
  }
}