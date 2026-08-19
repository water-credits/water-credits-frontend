import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WalletConnectComponent } from './wallet-connect';

describe('WalletConnectComponent', () => {
  let component: WalletConnectComponent;
  let fixture: ComponentFixture<WalletConnectComponent>;

  const setClipboard = (): void => {
    Object.defineProperty(window.navigator, 'clipboard', {
      value: {
        writeText: vi.fn(),
      },
      configurable: true,
    });
  };

  beforeEach(async () => {
    setClipboard();

    await TestBed.configureTestingModule({
      imports: [WalletConnectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WalletConnectComponent);
    component = fixture.componentInstance;
    component.connected = true;
    component.address = 'GCKFBEIYTKP2M6P4E4XJ3K5E6Q7V8N9XQ6Y87D7';
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fixture.destroy();
  });

  const getWalletToggleButton = (): HTMLButtonElement => {
    return fixture.nativeElement.querySelector('button') as HTMLButtonElement;
  };

  const getMenuActionButton = (label: string): HTMLButtonElement => {
    return Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>).find(
      (button) => button.textContent?.includes(label),
    ) as HTMLButtonElement;
  };

  it('opens the dropdown when the wallet button is clicked and keeps it open', () => {
    const toggleButton = getWalletToggleButton();

    toggleButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Copy Address');
    expect(fixture.nativeElement.textContent).toContain('Disconnect');
  });

  it('closes the dropdown when the user clicks outside the component', () => {
    const toggleButton = getWalletToggleButton();
    toggleButton.click();
    fixture.detectChanges();

    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Copy Address');
  });

  it('closes the dropdown when the wallet button is clicked again while it is open', () => {
    const toggleButton = getWalletToggleButton();

    toggleButton.click();
    fixture.detectChanges();
    toggleButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Copy Address');
  });

  it('copies the connected wallet address', () => {
    const clipboardSpy = vi.spyOn(navigator.clipboard, 'writeText');
    const toggleButton = getWalletToggleButton();

    toggleButton.click();
    fixture.detectChanges();

    const copyButton = getMenuActionButton('Copy Address');
    copyButton.click();

    expect(clipboardSpy).toHaveBeenCalledWith(component.address);
  });

  it('emits disconnect when the disconnect action is clicked', () => {
    const disconnectSpy = vi.fn();
    component.disconnect.subscribe(disconnectSpy);
    const toggleButton = getWalletToggleButton();

    toggleButton.click();
    fixture.detectChanges();

    const disconnectButton = getMenuActionButton('Disconnect');
    disconnectButton.click();

    expect(disconnectSpy).toHaveBeenCalledTimes(1);
  });
});
