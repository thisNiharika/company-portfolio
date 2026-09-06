import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectBuilder } from './project-builder';

describe('ProjectBuilder', () => {
  let component: ProjectBuilder;
  let fixture: ComponentFixture<ProjectBuilder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectBuilder],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectBuilder);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
