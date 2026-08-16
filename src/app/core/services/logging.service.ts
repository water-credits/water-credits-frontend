import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class LoggingService {
  private readonly isProduction = environment.production;

  info(message: string, ...optionalParams: unknown[]): void {
    if (!this.isProduction) {
      console.log(`[INFO] ${message}`, ...optionalParams);
    }
  }

  warn(message: string, ...optionalParams: unknown[]): void {
    if (!this.isProduction) {
      console.warn(`[WARN] ${message}`, ...optionalParams);
    }
  }

  error(message: string, error?: unknown): void {
    if (!this.isProduction) {
      console.error(`[ERROR] ${message}`, error);
    }
    // TODO: send to remote logging service (e.g. Sentry, Datadog)
    // when integration is configured in production
  }

  debug(message: string, ...optionalParams: unknown[]): void {
    if (!this.isProduction) {
      console.debug(`[DEBUG] ${message}`, ...optionalParams);
    }
  }
}
