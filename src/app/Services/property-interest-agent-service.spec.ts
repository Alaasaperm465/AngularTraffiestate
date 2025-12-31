import { TestBed } from '@angular/core/testing';

import { PropertyInterestAgentService } from './property-interest-agent-service';

describe('PropertyInterestAgentService', () => {
  let service: PropertyInterestAgentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PropertyInterestAgentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
