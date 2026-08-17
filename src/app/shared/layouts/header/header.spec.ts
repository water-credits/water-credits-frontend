import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { HeaderComponent } from './header';
import { WalletService } from '../../../core/services/wallet.service';
import {
  selectNotifications,
  selectUnreadNotificationCount,
} from '../../../core/store/ui/ui.selectors';
import { markNotificationsRead } from '../../../core/store/ui/ui.actions';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let store: MockStore;

  const initialState = {
    ui: {
      sidebarOpen: true,
      isDarkMode: true,
      isLoading: false,
      notifications: [],
      unreadNotificationCount: 0,
    },
    wallet: {
      address: null,
      loading: false,
      error: null,
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([]),
        provideMockStore({ initialState }),
        { provide: WalletService, useValue: { connect: vi.fn() } },
      ],
    }).compileComponents();

    store = TestBed.inject(MockStore);
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const openPanel = (): void => {
    const bell = fixture.nativeElement.querySelector('[aria-label="Notifications"]') as HTMLElement;
    bell.click();
    fixture.detectChanges();
  };

  const markAllReadButton = (): HTMLElement => {
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLElement>,
    );
    return buttons.find((b) => b.textContent?.includes('Mark all read')) as HTMLElement;
  };

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('hides the badge when the unread count is 0', () => {
    fixture.detectChanges();

    const bell = fixture.nativeElement.querySelector('[aria-label="Notifications"]') as HTMLElement;
    expect(bell.querySelector('.bg-retirement-red')).toBeNull();
  });

  it('shows the unread count badge when the unread count is greater than 0', () => {
    store.overrideSelector(selectUnreadNotificationCount, 3);
    store.refreshState();
    fixture.detectChanges();

    const bell = fixture.nativeElement.querySelector('[aria-label="Notifications"]') as HTMLElement;
    const badge = bell.querySelector('.bg-retirement-red') as HTMLElement;
    expect(badge).toBeTruthy();
    expect(badge.textContent?.trim()).toBe('3');
  });

  it('opens the notification panel when the bell is clicked', () => {
    fixture.detectChanges();
    expect(markAllReadButton()).toBeFalsy();

    openPanel();

    expect(markAllReadButton()).toBeTruthy();
  });

  it('closes the notification panel when clicking outside', () => {
    fixture.detectChanges();
    openPanel();
    expect(markAllReadButton()).toBeTruthy();

    document.body.click();
    fixture.detectChanges();

    expect(markAllReadButton()).toBeFalsy();
  });

  it('dispatches markNotificationsRead when "Mark all read" is clicked', () => {
    fixture.detectChanges();
    openPanel();

    const dispatchSpy = vi.spyOn(store, 'dispatch');
    markAllReadButton().click();

    expect(dispatchSpy).toHaveBeenCalledWith(markNotificationsRead());
  });

  it('shows the last 5 notifications with title and timestamp', () => {
    const notifications = Array.from({ length: 6 }, (_, i) => ({
      id: `n-${i}`,
      notificationType: (i % 2 === 0 ? 'info' : 'warning') as 'info' | 'warning',
      title: `Notification ${i}`,
      message: `Message ${i}`,
      timestamp: Date.now() - i * 1000,
      read: false,
    }));

    store.overrideSelector(selectNotifications, notifications);
    store.refreshState();
    fixture.detectChanges();
    openPanel();

    const ul = fixture.nativeElement.querySelector('ul') as HTMLElement;
    const items = Array.from(ul.querySelectorAll('li'));
    expect(items.length).toBe(5);
    expect(items[0].textContent).toContain('Notification 0');
    expect(items[4].textContent).toContain('Notification 4');
    expect(ul.textContent).not.toContain('Notification 5');
    expect(ul.textContent).toContain('Notification 4');
  });
});