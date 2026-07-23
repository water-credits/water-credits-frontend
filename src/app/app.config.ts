import { ApplicationConfig, provideZoneChangeDetection, isDevMode, ErrorHandler } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { reducers } from './core/store/app.state';
import { AuthEffects } from './core/store/auth/auth.effects';
import { ProjectsEffects } from './core/store/projects/projects.effects';
import { CreditsEffects } from './core/store/credits/credits.effects';
import { RetirementEffects } from './core/store/retirement/retirement.effects';
import { GovernanceEffects } from './core/store/governance/governance.effects';
import { SensorsEffects } from './core/store/sensors/sensors.effects';
import { MarketplaceEffects } from './core/store/marketplace/marketplace.effects';
import { FarmersEffects } from './core/store/farmers/farmers.effects';
import { AnalyticsEffects } from './core/store/analytics/analytics.effects';
import { WebsocketEffects } from './core/store/websocket/websocket.effects';
import { GlobalErrorHandler } from './core/services/error-handler.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideStore(reducers),
    provideEffects([
      AuthEffects,
      ProjectsEffects,
      CreditsEffects,
      RetirementEffects,
      GovernanceEffects,
      SensorsEffects,
      MarketplaceEffects,
      FarmersEffects,
      AnalyticsEffects,
      WebsocketEffects,
    ]),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
  ],
};
