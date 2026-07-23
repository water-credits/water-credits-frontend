import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ErrorBoundaryComponent } from './error-boundary.component';
import { GlobalErrorHandler } from '../../../core/services/error-handler.service';
import { By } from '@angular/platform-browser';

describe('ErrorBoundaryComponent', () => {
  let component: ErrorBoundaryComponent;
  let fixture: ComponentFixture<ErrorBoundaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorBoundaryComponent],
      providers: [GlobalErrorHandler]
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorBoundaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render ng-content when there is no error', () => {
    expect(component).toBeTruthy();
    const fallback = fixture.debugElement.query(By.css('.bg-red-50'));
    expect(fallback).toBeNull();
  });

  it('should render fallback UI when an error event is received', () => {
    GlobalErrorHandler.errorEvents.next(new Error('Test error'));
    fixture.detectChanges();
    
    const fallback = fixture.debugElement.query(By.css('.bg-red-50'));
    expect(fallback).toBeTruthy();
    expect(fallback.nativeElement.textContent).toContain('Something went wrong');
  });
});
