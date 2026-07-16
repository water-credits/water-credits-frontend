import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { reducers } from '../../../core/store/app.state';

import { SensorsDashboardComponent } from './sensors-dashboard';

describe('SensorsDashboardComponent', () => {
  let component: SensorsDashboardComponent;
  let fixture: ComponentFixture<SensorsDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SensorsDashboardComponent],
      providers: [provideRouter([]), provideStore(reducers), provideEffects([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SensorsDashboardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
