import { TestBed } from '@angular/core';
import { GlobalErrorHandler } from './global-error-handler';
import { LoggingService } from '../services/logging.service';

describe('GlobalErrorHandler', () => {
  let errorHandler: GlobalErrorHandler;
  let loggingServiceSpy: jasmine.SpyObj<LoggingService>;

  beforeEach(() => {
    loggingServiceSpy = jasmine.createSpyObj('LoggingService', ['error']);

    TestBed.configureTestingModule({
      providers: [
        GlobalErrorHandler,
        { provide: LoggingService, useValue: loggingServiceSpy },
      ],
    });

    errorHandler = TestBed.inject(GlobalErrorHandler);
  });

  it('should route uncaught errors to LoggingService.error()', () => {
    const error = new Error('Uncaught runtime exception');
    errorHandler.handleError(error);

    expect(loggingServiceSpy.error).toHaveBeenCalledWith(
      '[Uncaught Error]: Uncaught runtime exception',
      jasmine.any(Object),
      error
    );
  });
});
