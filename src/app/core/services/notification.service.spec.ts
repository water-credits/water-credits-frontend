import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
  });

  it('should suppress duplicate error toasts within 5 seconds', fakeAsync(() => {
    let notifications: any[] = [];
    service.notifications$.subscribe(n => notifications = n);

    service.error('Error', 'Test message');
    expect(notifications.length).toBe(1);

    service.error('Error', 'Test message');
    expect(notifications.length).toBe(1); // Should be deduplicated

    tick(5000);

    service.error('Error', 'Test message');
    expect(notifications.length).toBe(2); // Should not be deduplicated after 5s
  }));
});
