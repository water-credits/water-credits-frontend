import { ErrorHandler, Injectable, inject } from '@angular/core';
import { LoggingService } from '../services/logging.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private loggingService = inject(LoggingService);

  handleError(error: unknown): void {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    this.loggingService.error(`[Uncaught Error]: ${message}`, { stack }, error);

    // Keep default error stack visible in local development console
    console.error('[GlobalErrorHandler Caught Uncaught Exception]:', error);
  }
}
