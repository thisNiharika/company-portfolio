import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CanvasVideo } from './canvas-video';

describe('CanvasVideo', () => {
  let component: CanvasVideo;
  let fixture: ComponentFixture<CanvasVideo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CanvasVideo],
    }).compileComponents();

    fixture = TestBed.createComponent(CanvasVideo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
