import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Switcher } from './switcher';

describe('Switcher', () => {
  let component: Switcher;
  let fixture: ComponentFixture<Switcher>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Switcher]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Switcher);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
