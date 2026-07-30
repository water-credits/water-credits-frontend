import { Injectable, OnDestroy, Renderer2, RendererFactory2 } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';

/**
 * AnnouncerService — announces Angular route changes to screen readers.
 *
 * Angular is a SPA, so native browser navigation announcements do not fire
 * on route changes. This service injects a visually-hidden ARIA live region
 * and updates it with the new page title on every NavigationEnd event,
 * giving screen readers a cue that the view has changed (WCAG 4.1.3).
 *
 * Usage: inject this service in your AppComponent or root provider.
 */
@Injectable({ providedIn: 'root' })
export class AnnouncerService implements OnDestroy {
  private liveRegion: HTMLElement | null = null;
  private readonly renderer: Renderer2;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly router: Router,
    rendererFactory: RendererFactory2,
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.createLiveRegion();
    this.listenToRouteChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.liveRegion) {
      this.renderer.removeChild(document.body, this.liveRegion);
    }
  }

  /**
   * Manually announce a message to screen readers.
   * Use `'polite'` for non-urgent updates and `'assertive'` only for errors.
   */
  announce(message: string, politeness: 'polite' | 'assertive' = 'polite'): void {
    if (!this.liveRegion) return;

    // Toggle aria-live to force re-announcement of identical messages
    this.renderer.setAttribute(this.liveRegion, 'aria-live', 'off');
    this.renderer.setProperty(this.liveRegion, 'textContent', '');

    // Use rAF so the DOM change is processed before we set the live content
    requestAnimationFrame(() => {
      if (!this.liveRegion) return;
      this.renderer.setAttribute(this.liveRegion, 'aria-live', politeness);
      this.renderer.setProperty(this.liveRegion, 'textContent', message);
    });
  }

  // ── Private ──────────────────────────────────────────────────────────────

  /** Create a visually-hidden live region appended to <body>. */
  private createLiveRegion(): void {
    this.liveRegion = this.renderer.createElement('div');

    // Visually hidden but readable by screen readers
    const styles: Record<string, string> = {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0,0,0,0)',
      'white-space': 'nowrap',
      border: '0',
    };
    Object.entries(styles).forEach(([prop, value]) => {
      this.renderer.setStyle(this.liveRegion!, prop, value);
    });

    this.renderer.setAttribute(this.liveRegion!, 'aria-live', 'polite');
    this.renderer.setAttribute(this.liveRegion!, 'aria-atomic', 'true');
    this.renderer.setAttribute(this.liveRegion!, 'aria-relevant', 'additions text');
    this.renderer.appendChild(document.body, this.liveRegion!);
  }

  /**
   * Derive a human-readable page name from the route URL.
   * e.g. `/projects/new` → `"New project"`, `/dashboard` → `"Dashboard"`.
   */
  private routeToPageName(url: string): string {
    const segment = url.split('?')[0].split('#')[0];
    const parts = segment.split('/').filter(Boolean);
    if (parts.length === 0) return 'Dashboard';

    const routeLabels: Record<string, string> = {
      dashboard: 'Dashboard',
      projects: 'Projects',
      sensors: 'Sensors',
      credits: 'Credits',
      marketplace: 'Marketplace',
      retirement: 'Retirement',
      farmers: 'Farmers portal',
      governance: 'Governance',
      admin: 'Admin panel',
      explore: 'Explore',
      new: 'New',
      certificate: 'Certificate',
      orderbook: 'Order book',
      config: 'Sensor configuration',
      oracles: 'Oracle management',
      fees: 'Fee configuration',
      users: 'User management',
      parcels: 'Parcels',
      practices: 'Practices',
      earnings: 'Earnings',
    };

    const label = routeLabels[parts[parts.length - 1]] ?? parts[parts.length - 1];
    return `${label.charAt(0).toUpperCase()}${label.slice(1)} – Water Credits`;
  }

  private listenToRouteChanges(): void {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe((event: NavigationEnd) => {
        const pageName = this.routeToPageName(event.urlAfterRedirects);
        this.announce(`Navigated to ${pageName}`);
      });
  }
}
