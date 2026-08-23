import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

import { HeaderComponent } from './header';
import { WalletService } from '../../../core/services/wallet.service';
import { toggleSidebar, setDarkMode } from '../../../core/store/ui/ui.actions';

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
      emailNotificationsOptIn: false,
    },
    wallet: {
      address: null,
      network: null,
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

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('renders the notification centre', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement.querySelector('app-notification-center');
    expect(el).toBeTruthy();
  });

  it('dispatches toggleSidebar when the sidebar button is clicked', () => {
    fixture.detectChanges();
    const dispatchSpy = vi.spyOn(store, 'dispatch');

    const button = fixture.nativeElement.querySelector(
      '[aria-label="Toggle sidebar"]',
    ) as HTMLElement;
    button.click();

    expect(dispatchSpy).toHaveBeenCalledWith(toggleSidebar());
  });

  it('dispatches setDarkMode when the theme toggle is clicked', () => {
    fixture.detectChanges();
    const dispatchSpy = vi.spyOn(store, 'dispatch');

    const button = fixture.nativeElement.querySelector(
      '[aria-label="Switch to light mode"]',
    ) as HTMLElement;
    button.click();

    expect(dispatchSpy).toHaveBeenCalledWith(setDarkMode({ isDark: false }));
  });
});
