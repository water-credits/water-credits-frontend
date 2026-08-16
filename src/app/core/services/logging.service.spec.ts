import { environment } from '../../../environments/environment';
import { LoggingService } from './logging.service';

vi.mock('../../../environments/environment', () => ({
  environment: { production: false },
}));

describe('LoggingService', () => {
  let service: LoggingService;

  beforeEach(() => {
    environment.production = false;
    service = new LoggingService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('in development mode', () => {
    it('should log info messages to console', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      service.info('test info message');
      expect(spy).toHaveBeenCalledWith('[INFO] test info message');
      spy.mockRestore();
    });

    it('should log warn messages to console', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      service.warn('test warn message');
      expect(spy).toHaveBeenCalledWith('[WARN] test warn message');
      spy.mockRestore();
    });

    it('should log error messages to console', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      service.error('test error message');
      expect(spy).toHaveBeenCalledWith('[ERROR] test error message', undefined);
      spy.mockRestore();
    });

    it('should log error messages with an error object', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const testError = new Error('test error');
      service.error('test error message', testError);
      expect(spy).toHaveBeenCalledWith('[ERROR] test error message', testError);
      spy.mockRestore();
    });

    it('should log debug messages to console', () => {
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      service.debug('test debug message');
      expect(spy).toHaveBeenCalledWith('[DEBUG] test debug message');
      spy.mockRestore();
    });
  });

  describe('in production mode', () => {
    beforeEach(() => {
      environment.production = true;
      service = new LoggingService();
    });

    it('should suppress info messages from console.log', () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
      service.info('test info message');
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should suppress warn messages from console.warn', () => {
      const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      service.warn('test warn message');
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should suppress error messages from console.error', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      service.error('test error message');
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should suppress debug messages from console.debug', () => {
      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      service.debug('test debug message');
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
