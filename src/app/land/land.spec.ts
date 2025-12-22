import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Land } from './land';

describe('Land', () => {
  let component: Land;
  let fixture: ComponentFixture<Land>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Land]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Land);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
