import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { LogContext, LogEntry, LogLevel, LogLevelString } from '../models/log-entry.model';
import { SanitizerUtil } from '../utils/sanitizer.util';

@Injectable({
  providedIn: 'root',
})
export class LoggingService {
  private router = inject(Router, { optional: true });
  private globalContext: LogContext = {};
  private minLevel: LogLevel;
  private sentryInitialized = false;
  private sentryInstance: any = null;

  constructor() {
    this.minLevel = this.parseLogLevel(environment.minLogLevel || 'INFO');
    if (environment.production && environment.sentry?.enabled) {
      this.initSentryLazy();
    }
  }

  /**
   * Maintain backward compatibility API surface: debug(), info(), warn(), error()
   */

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext, error?: unknown): void {
    this.log(LogLevel.WARN, message, context, error);
  }

  error(message: string, context?: LogContext, error?: unknown): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Allows application to attach persistent context (e.g. current user ID, wallet address)
   */
  setContext(context: Partial<LogContext>): void {
    this.globalContext = { ...this.globalContext, ...SanitizerUtil.sanitize(context) };
  }

  clearContext(): void {
    this.globalContext = {};
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: unknown): void {
    if (level < this.minLevel) {
      return; // Filter out logs below minimum level
    }

    const levelStr = LogLevel[level] as LogLevelString;
    const currentRoute = this.router?.url || 'unknown';

    const mergedContext = SanitizerUtil.sanitize({
      ...this.globalContext,
      route: currentRoute,
      ...context,
    });

    const sanitizedMessage = SanitizerUtil.sanitize(message);
    const sanitizedError = error ? SanitizerUtil.sanitize(error) : undefined;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: levelStr,
      message: sanitizedMessage,
      context: mergedContext,
      error: sanitizedError,
    };

    if (environment.production) {
      this.dispatchToExternalServices(level, entry);
    } else {
      this.dispatchToConsole(level, entry);
    }
  }

  private dispatchToConsole(level: LogLevel, entry: LogEntry): void {
    const jsonOutput = JSON.stringify(entry);
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(jsonOutput);
        break;
      case LogLevel.INFO:
        console.info(jsonOutput);
        break;
      case LogLevel.WARN:
        console.warn(jsonOutput);
        break;
      case LogLevel.ERROR:
        console.error(jsonOutput);
        break;
    }
  }

  private async dispatchToExternalServices(level: LogLevel, entry: LogEntry): Promise<void> {
    if ((level === LogLevel.ERROR || level === LogLevel.WARN) && environment.sentry?.enabled) {
      await this.ensureSentryLoaded();
      if (this.sentryInstance) {
        this.sentryInstance.withScope((scope: any) => {
          if (entry.context) {
            scope.setExtras(entry.context);
            if (entry.context.userId) scope.setUser({ id: entry.context.userId as string });
          }
          if (entry.error) {
            this.sentryInstance.captureException(entry.error);
          } else {
            this.sentryInstance.captureMessage(`[${entry.level}] ${entry.message}`);
          }
        });
      }
    }
  }

  /**
   * Dynamically import Sentry to preserve bundle budget (<500kB)
   */
  private async initSentryLazy(): Promise<void> {
    try {
      const Sentry = await import('@sentry/angular');
      Sentry.init({
        dsn: environment.sentry.dsn,
        environment: environment.sentry.environment,
        tracesSampleRate: environment.sentry.tracesSampleRate,
      });
      this.sentryInstance = Sentry;
      this.sentryInitialized = true;
    } catch (e) {
      console.error('Failed to load Sentry dynamically', e);
    }
  }

  private async ensureSentryLoaded(): Promise<void> {
    if (!this.sentryInitialized) {
      await this.initSentryLazy();
    }
  }

  private parseLogLevel(levelStr: string): LogLevel {
    switch (levelStr?.toUpperCase()) {
      case 'DEBUG': return LogLevel.DEBUG;
      case 'INFO': return LogLevel.INFO;
      case 'WARN': return LogLevel.WARN;
      case 'ERROR': return LogLevel.ERROR;
      case 'NONE': return LogLevel.NONE;
      default: return LogLevel.INFO;
    }
  }
}
