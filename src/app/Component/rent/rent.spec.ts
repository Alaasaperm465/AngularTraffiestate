import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Rent } from './rent';

describe('Rent', () => {
  let component: Rent;
  let fixture: ComponentFixture<Rent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Rent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Rent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
