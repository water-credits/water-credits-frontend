import { ErrorHandler, Injectable } from '@angular/core';
import { LoggingService } from './logging.service';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GlobalErrorHandler implements ErrorHandler {
  public static readonly errorEvents = new Subject<Error>();

  constructor(private loggingService: LoggingService) {}

  handleError(error: any): void {
    this.loggingService.error('Unhandled Exception', error);
    GlobalErrorHandler.errorEvents.next(error);
  }
}
