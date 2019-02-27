import {inject, TestBed} from '@angular/core/testing';
import {QueryPlanService} from './query-plan.service';

describe('QueryPlanService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({providers: [QueryPlanService]});
  });

  it('should be created',
     inject([QueryPlanService], (service: QueryPlanService) => {
       expect(service).toBeTruthy();
     }));
});
