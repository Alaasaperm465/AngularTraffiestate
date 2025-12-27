import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Cancelbooking } from './cancelbooking';

describe('Cancelbooking', () => {
  let component: Cancelbooking;
  let fixture: ComponentFixture<Cancelbooking>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Cancelbooking]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Cancelbooking);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
