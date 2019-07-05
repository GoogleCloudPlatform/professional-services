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
import {Component, OnInit} from '@angular/core';
import {BqQueryPlan} from '../bq_query_plan';
import {LogService} from '../log.service';

@Component({
  selector: 'app-plan-status-card',
  templateUrl: './plan-status-card.component.html',
  styleUrls: ['./plan-status-card.component.css']
})
export class PlanStatusCardComponent {
  plan: BqQueryPlan;

  constructor(private logSvc: LogService) {}

  async loadPlan(plan: BqQueryPlan) {
    this.plan = plan;
  }

  get settings(): string {
    if (this.plan && this.plan.plan.configuration.query) {
      const results = {
        useLegacySql: this.plan.plan.configuration.query.useLegacySql,
        useQueryCache: this.plan.plan.configuration.query.useQueryCache,
        writeDisposition: this.plan.plan.configuration.query.writeDisposition,
        destinationTable: this.plan.plan.configuration.query.destinationTable,
        createDisposition: this.plan.plan.configuration.query.createDisposition
      };
      return JSON.stringify(results, null, 4);
    }
    return 'No Query Settings to display';
  }

  get sql(): string {
    if (this.plan && this.plan.plan.configuration.query) {
      return this.plan.plan.configuration.query.query;
    }
    return 'No Query to display';
  }

  /* Return a formatted view of general information from the query plan. */
  get overview(): string {
    if (this.plan) {
      const results = {
        etag: this.plan.plan.etag,
        id: this.plan.plan.id,
        jobId: this.plan.plan.jobReference.jobId,
        projectId: this.plan.plan.jobReference.projectId
      };
      return JSON.stringify(results, null, 4);
    }
    return 'No Overview to display';
  }

  /** Provide statistics of qp minus the queryplan part. */
  get statistics(): string {
    if (this.plan) {
      const stats = this.plan.plan.statistics;
      const duration = Number(stats.endTime) - Number(stats.startTime);
      const slots = Number(stats.query.totalSlotMs) / duration;

      const results = {
        'creationTime            ': new Date(Number(stats.creationTime)),
        'startTime               ': new Date(Number(stats.startTime)),
        'endTime                 ': new Date(Number(stats.endTime)),
        'elapsedMs               ': duration.toLocaleString('en'),
        'estd. slots used        ': Math.ceil(slots).toLocaleString('en'),
        'totalSlotMs             ': stats.query ?
            Number(stats.query.totalSlotMs).toLocaleString('en') :
            'n/a',
        'billingTier             ': stats.query ?
            Number(stats.query.billingTier).toLocaleString('en') :
            'n/a',
        'cacheHit                ':
            stats.query ? stats.query.cacheHit.toString() : 'n/a',
        'estimatedBytesProcessed ': stats.query ?
            Number(stats.query.estimatedBytesProcessed).toLocaleString('en') :
            'n/a',
        'totalBytesProcessed     ': stats.query ?
            Number(stats.query.totalBytesProcessed).toLocaleString('en') :
            'n/a',
        'totalBytesBilled        ': stats.query ?
            Number(stats.query.totalBytesBilled).toLocaleString('en') :
            'n/a',
        'totalPartitionsProcessed': stats.query ?
            Number(stats.query.totalPartitionsProcessed).toLocaleString('en') :
            'n/a',
      };
      return JSON.stringify(results, null, 4);
    }
    return 'No Timings to display';
  }

  /** Return status message. */
  get status(): string {
    if (!this.plan) {
      return 'No Status to display';
    }
    return JSON.stringify(this.plan.plan.status, null, 4);
  }

  /** Get timings information to be displayed. */
  get timings(): string {
    if (this.plan) {
      if (this.plan.plan.statistics.query) {
        return JSON.stringify(
            this.plan.plan.statistics.query.timeline, null, 4);
      } else {
        return JSON.stringify(this.plan.plan.statistics, null, 4);
      }
    }
    return 'No Statistics to display';
  }
}
