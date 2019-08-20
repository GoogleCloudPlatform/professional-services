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
import {LogService} from './log.service';

describe('BqQueryPlan', () => {
  const job = require('../assets/test/small_query_plan.json');
  beforeEach(() => {
    // fixture.setBase('test')
    TestBed.configureTestingModule({
      providers: [
        LogService,
      ],
    });
  });

  it('should parse a query plan', () => {
    const log = TestBed.get(LogService);
    const plan = new BqQueryPlan(job, log);
    expect(plan.nodes.length).toEqual(4);
    expect(plan.edges.length).toEqual(3);
  });

  it('should improve node info', () => {
    const log = TestBed.get(LogService);
    const plan = new BqQueryPlan(job, log);
    expect(plan.nodes[0]['durationMs  ']).toEqual('264');
    const t =
        'Fri Jun 29 2018 19:03:45 GMT+1000 (Australian Eastern Standard Time)';
    expect(plan.nodes[0]['startTime   '].toString()).toEqual(t);
    expect(plan.nodes[0]['endTime     '].toString()).toEqual(t);
    expect(plan.nodes[0]['start %     ']).toEqual('12.378% of job duration');
    expect(plan.nodes[0]['end %       ']).toEqual('22.31% of job duration');
  });

  it('should get a node by ID', () => {
    const log = TestBed.get(LogService);
    const plan = new BqQueryPlan(job, log);
    const node = plan.getNode('0');
    expect(node).toBeTruthy();
    expect(node.name).toEqual('S00: Input');
  });

  it('should get a stats as a string without steps', () => {
    const log = TestBed.get(LogService);
    const plan: any = new BqQueryPlan(job, log);
    const node = plan.getNode('0');
    const statsString = plan.getStageStats(node);
    const stats = JSON.parse(statsString);
    expect(stats).toBeTruthy();
    expect(stats['steps']).toBeFalsy();
    expect(stats['name           ']).toEqual('S00: Input');
  });

  it('should get colour for the max time', () => {
    const log = TestBed.get(LogService);
    // Cast to any to test private methods.
    const plan: any = new BqQueryPlan(job, log);
    // Wait is the slowest.
    expect(plan.colorForMaxTime(plan.getNode('1'))).toEqual('#fbc02d');
    // Read is the slowest.
    expect(plan.colorForMaxTime(plan.getNode('0'))).toEqual('#7b1fa2');
    // Compute is the slowest.
    expect(plan.colorForMaxTime(plan.getNode('2'))).toEqual('#ef6c00');
  });

  it('should get read nodes', () => {
    const log = TestBed.get(LogService);
    // Cast to any to test private methods.
    const plan: any = new BqQueryPlan(job, log);
    const reads = plan.getReads(plan.getNode('0'));
    expect(reads.length).toEqual(1);
    expect(reads[0]).toEqual('stephanmeyn-playground.raven.tradeData');
  });
});
