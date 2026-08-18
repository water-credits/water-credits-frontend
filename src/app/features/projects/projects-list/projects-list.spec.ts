import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideMockStore } from '@ngrx/store/testing';

import { ProjectsListComponent } from './projects-list';

describe('ProjectsListComponent', () => {
  let component: ProjectsListComponent;
  let fixture: ComponentFixture<ProjectsListComponent>;

  const initialState = {
    projects: {
      projects: [],
      selectedProject: null,
      filters: {},
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
      lastFetched: null,
      loading: false,
      error: null,
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectsListComponent],
      providers: [provideRouter([]), provideMockStore({ initialState })],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectsListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
