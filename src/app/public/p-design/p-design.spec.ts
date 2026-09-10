import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PDesign } from './p-design';

describe('PDesign', () => {
  let component: PDesign;
  let fixture: ComponentFixture<PDesign>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PDesign],
    }).compileComponents();

    fixture = TestBed.createComponent(PDesign);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
