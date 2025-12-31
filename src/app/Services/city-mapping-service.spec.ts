import { TestBed } from '@angular/core/testing';

import { CityMappingService } from './city-mapping-service';

describe('CityMappingService', () => {
  let service: CityMappingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CityMappingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
