import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { reducers } from '../../../core/store/app.state';

import { CreditsPortfolioComponent } from './credits-portfolio';

describe('CreditsPortfolioComponent', () => {
  let component: CreditsPortfolioComponent;
  let fixture: ComponentFixture<CreditsPortfolioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreditsPortfolioComponent],
      providers: [provideRouter([]), provideStore(reducers), provideEffects([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CreditsPortfolioComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
