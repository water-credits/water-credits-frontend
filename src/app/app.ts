import { Component, OnDestroy, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LucideAngularModule, WifiOff } from 'lucide-angular';
import { AnnouncerService } from './core/services/announcer.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LucideAngularModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly isOnline = signal<boolean>(true);
  protected readonly WifiOff = WifiOff;

  // Injected for its side-effect: it listens to NavigationEnd and announces
  // route changes to screen readers (WCAG 4.1.3). No public API needed here.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private readonly _announcer = inject(AnnouncerService);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isOnline.set(navigator.onLine);
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  private handleOnline = (): void => {
    this.isOnline.set(true);
  };

  private handleOffline = (): void => {
    this.isOnline.set(false);
  };
}
