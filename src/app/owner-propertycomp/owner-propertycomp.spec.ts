import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnerPropertycomp } from './owner-propertycomp';

describe('OwnerPropertycomp', () => {
  let component: OwnerPropertycomp;
  let fixture: ComponentFixture<OwnerPropertycomp>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnerPropertycomp]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OwnerPropertycomp);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
