import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RetireCreditsModalComponent } from './retire-credits-modal';

interface ModalState {
  currentStep: number;
  selectedProjectId: string;
  amount: string;
  purpose: string;
}

describe('RetireCreditsModalComponent', () => {
  let component: RetireCreditsModalComponent;
  let fixture: ComponentFixture<RetireCreditsModalComponent>;
  let state: ModalState;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RetireCreditsModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RetireCreditsModalComponent);
    component = fixture.componentInstance;
    state = component as unknown as ModalState;
    component.projects = [{ id: 'project-1', name: 'Clean River', balance: '123.4567890' }];
    state.selectedProjectId = 'project-1';
    state.currentStep = 1;
  });

  it('allows a positive amount within the available balance', () => {
    state.amount = '123.4567889';

    expect(component.canProceed).toBe(true);
    expect(component.amountError).toBeNull();
  });

  it('allows an amount exactly equal to the available balance', () => {
    state.amount = '123.4567890';

    expect(component.canProceed).toBe(true);
  });

  it.each(['', '0', '0.0000000', '-1', '1.00000001'])(
    'rejects an empty, non-positive, or over-precision amount: %s',
    (amount) => {
      state.amount = amount;

      expect(component.canProceed).toBe(false);
    },
  );

  it('rejects an amount over the balance without floating-point precision loss', () => {
    component.projects = [
      { id: 'project-1', name: 'Clean River', balance: '9007199254740993.0000001' },
    ];
    state.amount = '9007199254740993.0000002';

    expect(component.canProceed).toBe(false);
    expect(component.amountError).toBe('Exceeds available balance of 9007199254740993.0000001');
  });

  it('preserves the raw decimal string from the amount input', () => {
    component.projects = [
      { id: 'project-1', name: 'Clean River', balance: '9007199254740993.0000001' },
    ];
    fixture.detectChanges();

    const input = (fixture.nativeElement as HTMLElement).querySelector('input[type="number"]');
    if (!(input instanceof HTMLInputElement)) throw new Error('Amount input was not rendered');
    input.value = '9007199254740993.0000002';
    input.dispatchEvent(new Event('input'));

    expect(state.amount).toBe('9007199254740993.0000002');
    expect(component.canProceed).toBe(false);
  });

  it('renders the inline balance error and disables Continue', () => {
    state.amount = '123.4567891';
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const alert = element.querySelector('[role="alert"]');
    const continueButton = Array.from(element.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Continue'),
    );

    expect(alert?.textContent).toContain('Exceeds available balance of 123.4567890');
    expect(continueButton?.disabled).toBe(true);
    expect(continueButton?.getAttribute('title')).toBeNull();
  });

  it('emits the unchanged confirmation payload', () => {
    state.amount = '12.3456789';
    state.purpose = 'compliance';
    state.currentStep = 3;
    const emitted = vi.fn();
    component.confirm.subscribe(emitted);
    fixture.detectChanges();

    const confirmButton = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((button) => button.textContent?.includes('Confirm Retirement'));
    confirmButton?.click();

    expect(emitted).toHaveBeenCalledWith({
      projectId: 'project-1',
      amount: '12.3456789',
      purpose: 'compliance',
    });
  });
});
