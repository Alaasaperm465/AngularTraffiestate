import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FaviroteCom } from './favirote-com';

describe('FaviroteCom', () => {
  let component: FaviroteCom;
  let fixture: ComponentFixture<FaviroteCom>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FaviroteCom]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FaviroteCom);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
