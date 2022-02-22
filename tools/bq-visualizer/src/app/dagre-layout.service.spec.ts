/*
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
