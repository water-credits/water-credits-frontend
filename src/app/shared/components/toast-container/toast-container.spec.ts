import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { vi } from 'vitest';
import { ToastContainerComponent } from './toast-container';
import { NotificationService, ToastNotification } from '../../../core/services/notification.service';

/** Build a minimal ToastNotification for test helpers. */
function makeToast(overrides: Partial<ToastNotification> = {}): ToastNotification {
  return {
    id: 'test-id',
    type: 'success',
    title: 'Test title',
    message: 'Test message',
    duration: 5000,
    ...overrides,
  };
}

describe('ToastContainerComponent', () => {
  let fixture: ComponentFixture<ToastContainerComponent>;
  let component: ToastContainerComponent;
  let notificationsSubject: BehaviorSubject<ToastNotification[]>;
  let mockNotificationService: { notifications$: typeof notificationsSubject; remove: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    notificationsSubject = new BehaviorSubject<ToastNotification[]>([]);
    mockNotificationService = {
      notifications$: notificationsSubject,
      remove: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ToastContainerComponent],
      providers: [
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Empty state
  // ─────────────────────────────────────────────────────────────────────────

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders nothing when the notification queue is empty', () => {
    const toasts = fixture.nativeElement.querySelectorAll('[role="status"], [role="alert"]');
    expect(toasts.length).toBe(0);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Rendering a toast
  // ─────────────────────────────────────────────────────────────────────────

  it('renders a toast when notifications$ emits a single item', () => {
    notificationsSubject.next([makeToast()]);
    fixture.detectChanges();

    const toastEl: HTMLElement = fixture.nativeElement.querySelector('[role="status"]');
    expect(toastEl).toBeTruthy();
    expect(toastEl.textContent).toContain('Test title');
    expect(toastEl.textContent).toContain('Test message');
  });

  it('renders multiple simultaneous toasts independently', () => {
    notificationsSubject.next([
      makeToast({ id: 'a', type: 'success', title: 'First' }),
      makeToast({ id: 'b', type: 'error', title: 'Second' }),
    ]);
    fixture.detectChanges();

    const allToasts = fixture.nativeElement.querySelectorAll('[role], [aria-live]');
    const textContent: string = fixture.nativeElement.textContent;
    expect(textContent).toContain('First');
    expect(textContent).toContain('Second');
    // Two dismiss buttons — one per toast
    const closeButtons = fixture.nativeElement.querySelectorAll('button[aria-label="Dismiss notification"]');
    expect(closeButtons.length).toBe(2);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Dismiss button
  // ─────────────────────────────────────────────────────────────────────────

  it('calls notificationService.remove() with the correct id when the close button is clicked', () => {
    notificationsSubject.next([makeToast({ id: 'abc-123' })]);
    fixture.detectChanges();

    const closeBtn: HTMLButtonElement = fixture.nativeElement.querySelector(
      'button[aria-label="Dismiss notification"]',
    );
    expect(closeBtn).toBeTruthy();
    closeBtn.click();

    expect(mockNotificationService.remove).toHaveBeenCalledWith('abc-123');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Type → CSS class mapping
  // ─────────────────────────────────────────────────────────────────────────

  const typeTests: Array<{ type: ToastNotification['type']; expectedClass: string; expectedRole: string }> = [
    { type: 'success', expectedClass: 'bg-emerald-50',  expectedRole: 'status' },
    { type: 'error',   expectedClass: 'bg-red-50',      expectedRole: 'alert'  },
    { type: 'warning', expectedClass: 'bg-amber-50',    expectedRole: 'alert'  },
    { type: 'info',    expectedClass: 'bg-violet-50',   expectedRole: 'status' },
  ];

  typeTests.forEach(({ type, expectedClass, expectedRole }) => {
    it(`applies the correct CSS class for type "${type}"`, () => {
      notificationsSubject.next([makeToast({ id: type, type })]);
      fixture.detectChanges();

      const toastEl: HTMLElement = fixture.nativeElement.querySelector(`[role="${expectedRole}"]`);
      expect(toastEl).toBeTruthy();
      expect(toastEl.classList.toString()).toContain(expectedClass);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Accessibility attributes
  // ─────────────────────────────────────────────────────────────────────────

  it('uses role="alert" and aria-live="assertive" for error toasts', () => {
    notificationsSubject.next([makeToast({ type: 'error' })]);
    fixture.detectChanges();

    const toastEl: HTMLElement = fixture.nativeElement.querySelector('[role="alert"]');
    expect(toastEl).toBeTruthy();
    expect(toastEl.getAttribute('aria-live')).toBe('assertive');
  });

  it('uses role="alert" and aria-live="assertive" for warning toasts', () => {
    notificationsSubject.next([makeToast({ type: 'warning' })]);
    fixture.detectChanges();

    const toastEl: HTMLElement = fixture.nativeElement.querySelector('[role="alert"]');
    expect(toastEl).toBeTruthy();
    expect(toastEl.getAttribute('aria-live')).toBe('assertive');
  });

  it('uses role="status" and aria-live="polite" for success toasts', () => {
    notificationsSubject.next([makeToast({ type: 'success' })]);
    fixture.detectChanges();

    const toastEl: HTMLElement = fixture.nativeElement.querySelector('[role="status"]');
    expect(toastEl).toBeTruthy();
    expect(toastEl.getAttribute('aria-live')).toBe('polite');
  });

  it('uses role="status" and aria-live="polite" for info toasts', () => {
    notificationsSubject.next([makeToast({ type: 'info' })]);
    fixture.detectChanges();

    const toastEl: HTMLElement = fixture.nativeElement.querySelector('[role="status"]');
    expect(toastEl).toBeTruthy();
    expect(toastEl.getAttribute('aria-live')).toBe('polite');
  });

  // ─────────────────────────────────────────────────────────────────────────
  // trackById helper
  // ─────────────────────────────────────────────────────────────────────────

  it('trackById returns the toast id', () => {
    expect(component.trackById(0, makeToast({ id: 'xyz' }))).toBe('xyz');
  });
});
