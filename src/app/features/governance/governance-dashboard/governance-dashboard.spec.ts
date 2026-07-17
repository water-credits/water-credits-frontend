import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { GovernanceDashboardComponent } from './governance-dashboard';

import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { reducers } from '../../../core/store/app.state';

describe('GovernanceDashboardComponent', () => {
  let component: GovernanceDashboardComponent;
  let fixture: ComponentFixture<GovernanceDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GovernanceDashboardComponent],
      providers: [provideRouter([]), provideStore(reducers), provideEffects([])],
    }).compileComponents();

    fixture = TestBed.createComponent(GovernanceDashboardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
