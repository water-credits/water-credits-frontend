import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { NotificationCenterComponent } from './notification-center';
import {
  selectEmailNotificationsOptIn,
  selectNotifications,
  selectUnreadNotificationCount,
} from '../../../core/store/ui/ui.selectors';
import {
  markNotificationsRead,
  setEmailNotificationsOptIn,
} from '../../../core/store/ui/ui.actions';

describe('NotificationCenterComponent', () => {
  let component: NotificationCenterComponent;
  let fixture: ComponentFixture<NotificationCenterComponent>;
  let store: MockStore;

  const initialState = {
    ui: {
      sidebarOpen: true,
      isDarkMode: true,
      isLoading: false,
      notifications: [],
      unreadNotificationCount: 0,
      emailNotificationsOptIn: false,
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationCenterComponent],
      providers: [provideMockStore({ initialState })],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(NotificationCenterComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const bell = (): HTMLElement =>
    fixture.nativeElement.querySelector('[aria-label="Notifications"]') as HTMLElement;

  const panel = (): HTMLElement | null => fixture.nativeElement.querySelector('ul');

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('hides the badge when the unread count is 0', () => {
    fixture.detectChanges();
    expect(bell().querySelector('.bg-retirement-red')).toBeNull();
  });

  it('shows the unread count badge when the unread count is greater than 0', () => {
    store.overrideSelector(selectUnreadNotificationCount, 3);
    store.refreshState();
    fixture.detectChanges();

    const badge = bell().querySelector('.bg-retirement-red') as HTMLElement;
    expect(badge).toBeTruthy();
    expect(badge.textContent?.trim()).toBe('3');
  });

  it('opens the panel when the bell is clicked', () => {
    fixture.detectChanges();
    expect(panel()).toBeFalsy();

    bell().click();
    fixture.detectChanges();

    expect(panel()).toBeTruthy();
  });

  it('closes the panel when clicking outside', () => {
    fixture.detectChanges();
    bell().click();
    fixture.detectChanges();
    expect(panel()).toBeTruthy();

    document.body.click();
    fixture.detectChanges();

    expect(panel()).toBeFalsy();
  });

  it('dispatches markNotificationsRead when the panel is opened', () => {
    fixture.detectChanges();
    const dispatchSpy = vi.spyOn(store, 'dispatch');

    bell().click();
    fixture.detectChanges();

    expect(dispatchSpy).toHaveBeenCalledWith(markNotificationsRead());
  });

  it('does not dispatch markNotificationsRead when the panel is closed', () => {
    fixture.detectChanges();
    bell().click();
    fixture.detectChanges();

    const dispatchSpy = vi.spyOn(store, 'dispatch');
    bell().click();
    fixture.detectChanges();

    expect(dispatchSpy).not.toHaveBeenCalledWith(markNotificationsRead());
  });

  it('dispatches markNotificationsRead when "Mark all read" is clicked', () => {
    fixture.detectChanges();
    bell().click();
    fixture.detectChanges();

    const dispatchSpy = vi.spyOn(store, 'dispatch');
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLElement>,
    );
    const markAllReadButton = buttons.find((b) => b.textContent?.includes('Mark all read'));
    markAllReadButton?.click();

    expect(dispatchSpy).toHaveBeenCalledWith(markNotificationsRead());
  });

  it('renders read/unread notifications with distinct styling', () => {
    const notifications = [
      {
        id: 'n-1',
        notificationType: 'info' as const,
        title: 'Unread one',
        message: 'msg',
        timestamp: Date.now(),
        read: false,
      },
      {
        id: 'n-2',
        notificationType: 'success' as const,
        title: 'Read one',
        message: 'msg',
        timestamp: Date.now(),
        read: true,
      },
    ];

    store.overrideSelector(selectNotifications, notifications);
    store.refreshState();
    fixture.detectChanges();
    bell().click();
    fixture.detectChanges();

    const items = Array.from(fixture.nativeElement.querySelectorAll('li')) as HTMLElement[];
    expect(items.length).toBe(2);
    expect(items[0].querySelector('.font-semibold')).toBeTruthy();
    expect(items[0].querySelector('.bg-retirement-red')).toBeTruthy();
    expect(items[1].querySelector('.font-semibold')).toBeFalsy();
  });

  it('dispatches setEmailNotificationsOptIn when the email toggle changes', () => {
    fixture.detectChanges();
    bell().click();
    fixture.detectChanges();

    const dispatchSpy = vi.spyOn(store, 'dispatch');
    const checkbox = fixture.nativeElement.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));

    expect(dispatchSpy).toHaveBeenCalledWith(setEmailNotificationsOptIn({ optIn: true }));
  });

  it('reflects the persisted email opt-in state', () => {
    store.overrideSelector(selectEmailNotificationsOptIn, true);
    store.refreshState();
    fixture.detectChanges();
    bell().click();
    fixture.detectChanges();

    const checkbox = fixture.nativeElement.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });
});
