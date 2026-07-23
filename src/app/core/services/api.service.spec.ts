import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ApiService } from './api.service';
import { SessionBusService } from './session-bus.service';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

describe('ApiService', () => {
  let service: ApiService;
  let mockAxios: MockAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SessionBusService]
    });
    service = TestBed.inject(ApiService);
    mockAxios = new MockAdapter((service as any).axiosInstance);
  });

  afterEach(() => {
    mockAxios.restore();
  });

  it('should retry a transient 503 error up to 2 times', async () => {
    mockAxios.onGet('/test').reply(503, { message: 'Service Unavailable' });

    const startTime = Date.now();
    try {
      await service.get('/test');
      fail('should have thrown');
    } catch (e: any) {
      expect(e.response.status).toBe(503);
      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(3000); // 1000ms + 2000ms
    }
    
    // axios-mock-adapter history doesn't track retries well, but the delay proves it tried.
  });

  it('should not retry a 400 error', async () => {
    mockAxios.onGet('/test-400').reply(400, { message: 'Bad Request' });

    const startTime = Date.now();
    try {
      await service.get('/test-400');
      fail('should have thrown');
    } catch (e: any) {
      expect(e.response.status).toBe(400);
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // No backoff
    }
  });
});
