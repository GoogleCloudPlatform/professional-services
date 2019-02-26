import {inject, TestBed} from '@angular/core/testing';

import {BqQueryPlan} from './bq_query_plan';
import {DagreLayoutService} from './dagre-layout.service';
import {LogService} from './log.service';
import {Job} from './rest_interfaces';

describe('DagreLayoutService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DagreLayoutService,
        LogService,
      ],
    });
  });

  it('should create a layout', () => {
    const service = TestBed.get(DagreLayoutService);
    expect(service).toBeTruthy();
    const log = TestBed.get(LogService);
    const job = require('../assets/test/small_query_plan.json');
    const plan = new BqQueryPlan(job, log);
    const graph = service.layout(plan);
    expect(graph).toBeTruthy();
  });
});
