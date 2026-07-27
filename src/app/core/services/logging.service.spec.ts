import { TestBed } from '@angular/core';
import { LoggingService } from './logging.service';
import { LogLevel } from '../models/log-entry.model';
import { environment } from '../../../environments/environment';

describe('LoggingService', () => {
  let service: LoggingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoggingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should filter out DEBUG logs when minimum level is INFO', () => {
    spyOn(console, 'debug');
    (service as any).minLevel = LogLevel.INFO;

    service.debug('Debug message');
    expect(console.debug).not.toHaveBeenCalled();
  });

  it('should emit INFO logs when minimum level is INFO', () => {
    spyOn(console, 'info');
    (service as any).minLevel = LogLevel.INFO;

    service.info('Info message');
    expect(console.info).toHaveBeenCalled();
  });

  it('should include enriched contextual metadata in logs', () => {
    spyOn(console, 'error');
    service.setContext({ userId: 'usr_123', walletAddress: 'GABC...' });

    service.error('Failed transaction', { txId: '0x123' });

    expect(console.error).toHaveBeenCalledWith(jasmine.stringMatching('usr_123'));
    expect(console.error).toHaveBeenCalledWith(jasmine.stringMatching('GABC...'));
  });
});
